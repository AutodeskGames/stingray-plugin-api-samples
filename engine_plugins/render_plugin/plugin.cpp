#include <engine_plugin_api/plugin_api.h>
#include <plugin_foundation/id_string.h>
#include <plugin_foundation/array.h>
#include <plugin_foundation/allocator.h>
#include <plugin_foundation/matrix4x4.h>
#include <plugin_foundation/vector3.h>
#include <plugin_foundation/vector2.h>
#include <plugin_foundation/platform.h>

#include <string.h>

using namespace stingray_plugin_foundation;

LuaApi *_lua;
RenderBufferApi *_render_buffer;
MeshObjectApi *_mesh_api;
MaterialApi *_material_api;
ApplicationApi *_application_api;
ResourceManagerApi *_resource_api;
AllocatorApi *_allocator_api;
AllocatorObject *_allocator_object;
ApiAllocator _allocator = ApiAllocator(nullptr, nullptr);
SceneGraphApi *_scene_graph;
UnitApi *_unit;
ProfilerApi *_profiler;

struct Vertex {
	Vector3 pos;
	Vector3 normal;
	Vector2 uv;
};

void calc_bounding_volume(const Array<Vertex> &vertices, Vector3 &bv_min, Vector3 &bv_max) {
	for (auto &v : vertices) {
		if (v.pos.x < bv_min.x)
			bv_min.x = v.pos.x;
		if (v.pos.y < bv_min.y)
			bv_min.y = v.pos.y;
		if (v.pos.z < bv_min.z)
			bv_min.z = v.pos.z;

		if (v.pos.x > bv_max.x)
			bv_max.x = v.pos.x;
		if (v.pos.y > bv_max.y)
			bv_max.y = v.pos.y;
		if (v.pos.z > bv_max.z)
			bv_max.z = v.pos.z;
	}
}

void calc_vertex_normals(Array<Vertex> &vertices, Array<uint16_t> &indices) {
	for (auto &v : vertices)
		v.normal = vector3(0,0,0);

	uint32_t n_faces = indices.size() / 3;
	for (uint32_t f=0; f!=n_faces; ++f) {
		auto &v0 = vertices[indices[f*3+0]];
		auto &v1 = vertices[indices[f*3+1]];
		auto &v2 = vertices[indices[f*3+2]];

		Vector3 face_normal = normalize(cross(v0.pos - v1.pos, v0.pos - v2.pos));
		v0.normal += face_normal;
		v1.normal += face_normal;
		v2.normal += face_normal;
	}

	for (auto &v : vertices)
		v.normal = normalize(v.normal);
}

struct ClothPoint {
	uint32_t vertex_idx;
	Vector3 old_pos;
	bool fixed;
};

inline ClothPoint cloth_point(uint32_t vertex_id, const Vector3 &old_pos, bool fixed) {
	ClothPoint p = { vertex_id, old_pos, fixed };
	return p;
}

inline uint32_t insert_point(Array<ClothPoint> &points, const ClothPoint &point) {
	uint32_t n_points = points.size();
	for (uint32_t p=0; p!=n_points; ++p) {
		if (points[p].vertex_idx == point.vertex_idx)
			return p;
	}
	points.push_back(point);
	return n_points;
}

struct ClothSpring {
	uint32_t p0; uint32_t p1;
	float rest_length;
};
inline ClothSpring cloth_spring(uint32_t p0, uint32_t p1, float rest_length) {
	ClothSpring s = { p0, p1, rest_length };
	return s;
}

struct Cloth {
	Cloth(Allocator &a) : points(a), springs(a) {}
	Array<ClothPoint> points;
	Array<ClothSpring> springs;
};

void cloth_simulation(Array<ClothPoint> &points, Array<Vertex> &vertices, float dt, const Vector3 &force) {
	float dt2 = dt*dt;
	uint32_t n_points = points.size();
	for (uint32_t i=0; i!=n_points; ++i) {
		auto &p = points[i];
		if (p.fixed)
			continue;

		auto &pos = vertices[p.vertex_idx].pos;
		auto tmp = pos;
		pos = pos + (pos - p.old_pos + force * dt2);
		p.old_pos = tmp;
	}
}

void cloth_springs(const Array<ClothSpring> &springs, Array<ClothPoint> &points, Array<Vertex> &vertices, uint32_t iteration_count) {
	uint32_t n_springs = springs.size();
	for (uint32_t iter=0; iter!=iteration_count; ++iter) {
		for (uint32_t i=0; i!=n_springs; ++i) {
			const auto &s = springs[i];
			auto &p0 = points[s.p0];
			auto &p1 = points[s.p1];

			auto &p0_pos = vertices[p0.vertex_idx].pos;
			auto &p1_pos = vertices[p1.vertex_idx].pos;

			auto d = p1_pos - p0_pos;
			float l = length(d);
			float diff = l - s.rest_length;
			d = normalize(d);

			p0_pos = p0_pos + d * diff * (p0.fixed ? 0 : p1.fixed ? 1.0f : 0.5f);
			p1_pos = p1_pos - d * diff * (p1.fixed ? 0 : p0.fixed ? 1.0f : 0.5f);
		}
	}
}

struct Object {
	bool used;
	uint32_t vbuffer;
	uint32_t ibuffer;
	uint32_t vdecl;
	uint32_t mesh;
	uint32_t texture;
	RB_TextureBufferView tview;
	Array<Vertex> *vertices;
	Array<uint16_t> *indices;
	Array<uint8_t> *texture_data;
	Cloth *cloth;
	const Matrix4x4 *transform;
	float acc_time;
};
typedef Array<Object> Objects;
Objects *_objects = nullptr;
typedef Array<uint32_t> FreeObjects;
FreeObjects *_free_objects = nullptr;
float acc_time = 0.f;

inline uint32_t insert_vertex(Array<Vertex> &vertices, const Vertex &vtx) {
	uint32_t n_vertices = vertices.size();
	for (uint32_t v=0; v!=n_vertices; ++v) {
		if (vertices[v].pos == vtx.pos && vertices[v].normal == vtx.normal && vertices[v].uv == vtx.uv)
			return v;
	}
	vertices.push_back(vtx);
	return n_vertices;
}

enum { UPPER_LEFT = 0x1, UPPER_RIGHT = 0x2, LOWER_LEFT = 0x4, LOWER_RIGHT = 0x8 };
void set_pixel(Array<uint16_t> *indices, Array<Vertex> &vertices, float x, float y, float ps, Cloth *cloth = nullptr, uint32_t freeze_flags = 0)
{
	const Vertex pixel_v[] = {
		{ vector3(x   , 0, y   ), vector3(0, -1, 0), vector2(x   , y-ps) },
		{ vector3(x+ps, 0, y   ), vector3(0, -1, 0), vector2(x+ps, y-ps) },
		{ vector3(x   , 0, y+ps), vector3(0, -1, 0), vector2(x   , y   ) },
		{ vector3(x+ps, 0, y+ps), vector3(0, -1, 0), vector2(x+ps, y   ) }
	};


	uint32_t vtx_indices[] = {
		insert_vertex(vertices, pixel_v[0]),
		insert_vertex(vertices, pixel_v[1]),
		insert_vertex(vertices, pixel_v[2]),
		insert_vertex(vertices, pixel_v[3])
	};

	if (indices) {
		// front faces
		indices->push_back(vtx_indices[0]); indices->push_back(vtx_indices[1]); indices->push_back(vtx_indices[2]);
		indices->push_back(vtx_indices[1]); indices->push_back(vtx_indices[3]); indices->push_back(vtx_indices[2]);
	}

	if (cloth) {
		uint32_t cp_indices[] = {
			insert_point(cloth->points, cloth_point(vtx_indices[0], pixel_v[0].pos, (freeze_flags & LOWER_LEFT) != 0)),
			insert_point(cloth->points, cloth_point(vtx_indices[1], pixel_v[1].pos, (freeze_flags & LOWER_RIGHT) != 0)),
			insert_point(cloth->points, cloth_point(vtx_indices[2], pixel_v[2].pos, (freeze_flags & UPPER_LEFT) != 0)),
			insert_point(cloth->points, cloth_point(vtx_indices[3], pixel_v[3].pos, (freeze_flags & UPPER_RIGHT) != 0))
		};

		cloth->springs.push_back(cloth_spring(cp_indices[0], cp_indices[1], length(pixel_v[0].pos - pixel_v[1].pos)));
		cloth->springs.push_back(cloth_spring(cp_indices[1], cp_indices[3], length(pixel_v[1].pos - pixel_v[2].pos)));
		cloth->springs.push_back(cloth_spring(cp_indices[3], cp_indices[2], length(pixel_v[2].pos - pixel_v[3].pos)));
		cloth->springs.push_back(cloth_spring(cp_indices[2], cp_indices[0], length(pixel_v[3].pos - pixel_v[0].pos)));
	}
}

void mandelbrot(uint8_t *pixels, uint32_t width, uint32_t height, float time, uint32_t n_mips)
{
	struct Color {
		uint8_t red, green, blue, alpha;
	};

	// quick & ugly port of: https://www.shadertoy.com/view/4df3Rn
	// this only here as a silly sample, its not supposed to be fast or beutiful
	_profiler->profile_start("mandelbrot");
	{
		float zoo = 0.62 + 0.38*cosf(.07*time);
		float coa = cosf(0.15*(1.0 - zoo)*time);
		float sia = sinf(0.15*(1.0 - zoo)*time);
		zoo = pow(zoo, 8.0);

		auto *colors = (Color*)pixels;
		for (uint32_t yi = 0; yi != width; ++yi) {
			for (uint32_t xi = 0; xi != height; ++xi) {
				Vector2 p = (-vector2(width, height) + 2 * vector2(xi, yi)) / vector2(width, height);
				Vector2 xy = vector2(p.x*coa - p.y*sia, p.x*sia + p.y*coa);
				Vector2 c = vector2(-0.745f, 0.186f) + xy * zoo;
				Vector2 z = vector2(0.f, 0.f);
				float l = 0;
				for (uint32_t i = 0; i != 128; ++i) {
					z = vector2(z.x*z.x - z.y*z.y, 2.f*z.x*z.y) + c;
					if (dot(z, z) > (128 * 128)) break;
					++l;
				}

				float r = 0.5f + 0.5f*cosf(3.0f + l*0.3f);
				float g = 0.5f + 0.5f*cosf(3.0f + l*0.3f + 0.6f);
				float b = 0.5f + 0.5f*cosf(3.0f + l*0.3f + 1.f);
				colors[yi * width + xi] = {
					(uint8_t)(r * 255.f),
					(uint8_t)(g * 255.f),
					(uint8_t)(b * 255.f),
					255
				};
			}
		}
	}
	_profiler->profile_stop();

	_profiler->profile_start("mip-map-generation");
	{
		// super naive mip-map generation, assumes source data is in linear color space and resolution is power of two
		uint32_t src_offset = 0;
		uint32_t dest_offset = width * height * 4;
		for (uint32_t m = 1; m < n_mips; ++m) {
			uint32_t dest_w = width >> m;
			uint32_t dest_h = height >> m;
			uint32_t src_w = width >> (m - 1);
			uint32_t src_h = height >> (m - 1);
			auto *src_data = (Color*)(pixels + src_offset);
			auto *dest_data = (Color*)(pixels + dest_offset);

			for (uint32_t y = 0; y != dest_h; ++y) {
				for (uint32_t x = 0; x != dest_w; ++x) {
					const auto &ul = src_data[(y * 2 + 0)*src_w + (x * 2 + 0)];
					const auto &ur = src_data[(y * 2 + 0)*src_w + (x * 2 + 1)];
					const auto &ll = src_data[(y * 2 + 1)*src_w + (x * 2 + 0)];
					const auto &lr = src_data[(y * 2 + 1)*src_w + (x * 2 + 1)];

					dest_data[y*dest_h + x] = {
						(uint8_t)(((uint32_t)ul.red + (uint32_t)ur.red + (uint32_t)ll.red + (uint32_t)lr.red) >> 2),
						(uint8_t)(((uint32_t)ul.green + (uint32_t)ur.green + (uint32_t)ll.green + (uint32_t)lr.green) >> 2),
						(uint8_t)(((uint32_t)ul.blue + (uint32_t)ur.blue + (uint32_t)ll.blue + (uint32_t)lr.blue) >> 2),
						255
					};
				}
			}

			src_offset = dest_offset;
			dest_offset += dest_w * dest_h * 4;
		}
	}
	_profiler->profile_stop();
}

static int create_logo(struct lua_State *L)
{
	uint32_t idx = 0;

	if (!_free_objects->empty()) {
		idx = _free_objects->back();
		_free_objects->pop_back();
	} else {
		idx = _objects->size();
		_objects->resize(idx + 1);
	}

	auto &o = (*_objects)[idx];
	o.used = true;
	o.acc_time = 0.f;

	const RB_VertexChannel vchannels[] = {
		{ _render_buffer->format(RB_ComponentType::RB_FLOAT_COMPONENT, true, false, 32, 32, 32, 0), RB_VertexSemantic::RB_POSITION_SEMANTIC,0, 0, false },
		{ _render_buffer->format(RB_ComponentType::RB_FLOAT_COMPONENT, true, false, 32, 32, 32, 0), RB_VertexSemantic::RB_NORMAL_SEMANTIC,0, 0, false },
		{ _render_buffer->format(RB_ComponentType::RB_FLOAT_COMPONENT, true, false, 32, 32, 0, 0), RB_VertexSemantic::RB_TEXCOORD_SEMANTIC,0, 0, false }
	};
	const uint32_t n_channels = sizeof(vchannels) / sizeof(RB_VertexChannel);

	RB_VertexDescription vdesc;
	vdesc.n_channels = n_channels;
	uint32_t stride = 0;
	for (uint32_t i=0; i!=n_channels; ++i) {
		stride += _render_buffer->num_bits(vchannels[i].format) / 8;
		vdesc.channels[i] = vchannels[i];
	}
	o.vdecl = _render_buffer->create_description(RB_Description::RB_VERTEX_DESCRIPTION, &vdesc);

	const uint8_t stingray_logo[] = {
		1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1,
		1, 1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 1, 1, 0, 1, 1,
		1, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1,
		0, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 0, 0, 0, 1, 1,
		1, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1
	};
	uint32_t logo_height = 5;
	uint32_t logo_width = sizeof(stingray_logo) / logo_height;

	RB_VertexBufferView vb_view;
	vb_view.stride = stride;

	RB_IndexBufferView ib_view;
	ib_view.stride = 2;

	o.indices = MAKE_NEW(_allocator, Array<uint16_t>, _allocator);
	o.vertices = MAKE_NEW(_allocator, Array<Vertex>, _allocator);
	o.cloth = MAKE_NEW(_allocator, Cloth, _allocator);

	const uint32_t sub_division = 2;
	const float pixel_size = 1;
	const float sub_pixel_size = pixel_size / sub_division;
	float x_offs = 0;
	float y_offs = (float)(logo_height / 2) * pixel_size;
	for (uint32_t y=0; y!= logo_height*sub_division; ++y, y_offs -= sub_pixel_size) {
		x_offs = -(float)(logo_width / 2) * pixel_size;
		for (uint32_t x=0; x!= logo_width*sub_division; ++x, x_offs += sub_pixel_size) {
			uint32_t pixel_idx = (y / sub_division) * logo_width + x / sub_division;
			uint32_t next_pixel_idx = (y / sub_division) * logo_width + (x+1) / sub_division;
			bool pixel = stingray_logo[pixel_idx] != 0;
			uint32_t fixed_flag = (y == 0) ? (x == 0) ? UPPER_LEFT : (x == (logo_width*sub_division-1)) ? UPPER_RIGHT : (pixel && stingray_logo[next_pixel_idx] == 0) ? UPPER_RIGHT : (!pixel && stingray_logo[next_pixel_idx] != 0) ? UPPER_LEFT : 0 : 0;
			set_pixel(pixel ? o.indices : nullptr, *o.vertices, x_offs, y_offs, sub_pixel_size, o.cloth, fixed_flag);
		}
	}

	o.vbuffer = _render_buffer->create_buffer(o.vertices->size() * vb_view.stride, RB_Validity::RB_VALIDITY_UPDATABLE, RB_View::RB_VERTEX_BUFFER_VIEW, &vb_view, o.vertices->begin());
	o.ibuffer = _render_buffer->create_buffer(o.indices->size() * ib_view.stride, RB_Validity::RB_VALIDITY_STATIC, RB_View::RB_INDEX_BUFFER_VIEW, &ib_view, o.indices->begin());

	o.tview.format =  _render_buffer->format(RB_ComponentType::RB_INTEGER_COMPONENT, false, true, 8, 8, 8, 8);
	o.tview.depth = o.tview.slices = 1;
	o.tview.mip_levels = 8;
	o.tview.width = 128; o.tview.height = 128;
	o.tview.type = RB_TEXTURE_TYPE_2D;
	memset(&o.tview.reserved, 0, sizeof(o.tview.reserved));
	o.texture_data = MAKE_NEW(_allocator, Array<uint8_t>, _allocator);
	uint32_t bytes_per_pixel = _render_buffer->num_bits(o.tview.format) / 8;
	uint32_t t_size = 0;
	for (uint32_t m = 0; m != o.tview.mip_levels; ++m)
		t_size += (o.tview.width >> m) * (o.tview.height >> m) * bytes_per_pixel;
	o.texture_data->resize(t_size);
	mandelbrot(o.texture_data->begin(), o.tview.width, o.tview.height, 0.1f, o.tview.mip_levels);
	o.texture = _render_buffer->create_buffer(t_size, RB_Validity::RB_VALIDITY_UPDATABLE, RB_View::RB_TEXTURE_BUFFER_VIEW, &o.tview, o.texture_data->begin());

	uint32_t node_name = IdString64(_lua->tolstring(L, 2, NULL)).id() >> 32;
	o.mesh = _mesh_api->create(_lua->getunit(L, 1), node_name, node_name, MO_Flags::MO_VIEWPORT_VISIBLE_FLAG | MO_Flags::MO_SHADOW_CASTER_FLAG);
	o.transform = (const Matrix4x4*)_scene_graph->world(_unit->scene_graph(_lua->getunit(L, 1)), 0);

	float bv_min[] = { -(float)(logo_width /2), -0.001f, -(float)(logo_height / 2) };
	float bv_max[] = { (float)(logo_width /2), 0.001f, (float)(logo_height / 2) };
	_mesh_api->set_bounding_box(o.mesh, bv_min, bv_max);

	MO_BatchInfo batch_info = { MO_PrimitiveType::MO_TRIANGLE_LIST, 0, 0, o.indices->size() / 3, 0, 0, 1 };
	_mesh_api->set_batch_info(o.mesh, 1, &batch_info);

	_mesh_api->add_resource(o.mesh, _render_buffer->lookup_resource(o.vbuffer));
	_mesh_api->add_resource(o.mesh, _render_buffer->lookup_resource(o.vdecl));
	_mesh_api->add_resource(o.mesh, _render_buffer->lookup_resource(o.ibuffer));

	void *materials[] = { _resource_api->get("material", _lua->tolstring(L, 3, NULL)) };
	_mesh_api->set_materials(o.mesh, 1, materials);

	// assign texture
	const RenderResource *resources[] = { _render_buffer->lookup_resource(o.texture) };
	uint32_t resource_names[] = { IdString32("diffuse_map").id() };
	_material_api->set_resources(_mesh_api->material(o.mesh, 0), 1, resource_names, resources);

	_lua->pushinteger(L, idx);
	return 1;
}

static int destroy_logo(struct lua_State *L)
{
	uint32_t idx = (uint32_t)_lua->tointeger(L, 1);
	auto &o = (*_objects)[idx];

	o.used = false;
	_render_buffer->destroy_buffer(o.ibuffer);
	_render_buffer->destroy_buffer(o.vbuffer);
	_render_buffer->destroy_buffer(o.texture);
	_render_buffer->destroy_description(o.vdecl);
	_mesh_api->destroy(o.mesh);
	MAKE_DELETE(_allocator, o.cloth);
	MAKE_DELETE(_allocator, o.vertices);
	MAKE_DELETE(_allocator, o.indices);
	MAKE_DELETE(_allocator, o.texture_data);

	return 0;
}

static const char *get_name()
{
	return "render_plugin";
}

static void setup_game(GetApiFunction get_engine_api)
{
	_application_api = (ApplicationApi*)get_engine_api(APPLICATION_API_ID);
	_render_buffer = (RenderBufferApi*)get_engine_api(RENDER_BUFFER_API_ID);
	_mesh_api = (MeshObjectApi*)get_engine_api(MESH_API_ID);
	_material_api = (MaterialApi*)get_engine_api(MATERIAL_API_ID);
	_resource_api = (ResourceManagerApi*)get_engine_api(RESOURCE_MANAGER_API_ID);
	_unit = (UnitApi*)get_engine_api(UNIT_API_ID);
	_scene_graph = (SceneGraphApi*)get_engine_api(SCENE_GRAPH_API_ID);
	_profiler = (ProfilerApi*)get_engine_api(PROFILER_API_ID);
	_allocator_api = (AllocatorApi*)get_engine_api(ALLOCATOR_API_ID);
	_allocator_object = _allocator_api->make_plugin_allocator("RenderPlugin");
	_allocator = ApiAllocator(_allocator_api, _allocator_object);

	_lua = (LuaApi*)get_engine_api(LUA_API_ID);
	_lua->add_module_function("RenderPlugin", "create_logo", create_logo);
	_lua->add_module_function("RenderPlugin", "destroy_logo", destroy_logo);

	_objects = MAKE_NEW(_allocator, Objects, _allocator);
	_free_objects = MAKE_NEW(_allocator, FreeObjects, _allocator);
}

static void shutdown_game()
{
	for (auto &o : *_objects) {
		if (!o.used)
			continue;

		_render_buffer->destroy_buffer(o.ibuffer);
		_render_buffer->destroy_buffer(o.vbuffer);
		_render_buffer->destroy_description(o.vdecl);
		_mesh_api->destroy(o.mesh);
		MAKE_DELETE(_allocator, o.cloth);
		MAKE_DELETE(_allocator, o.vertices);
		MAKE_DELETE(_allocator, o.indices);
	}
	MAKE_DELETE(_allocator, _objects);
	MAKE_DELETE(_allocator, _free_objects);
	_allocator_api->destroy_plugin_allocator(_allocator_object);
}

static void update_game(float dt)
{
	for (auto &o : *_objects) {
		if (!o.used || o.cloth == nullptr)
			continue;
		o.acc_time += dt;

		_profiler->profile_start("cloth-simulation");
		{
			// cloth simulation is stepped in 60Hz
			const float simulation_dt = 1.f / 60.f;
			uint32_t n_simulation_steps = (uint32_t)ceil(dt / simulation_dt);
			for (uint32_t i = 0; i != n_simulation_steps; ++i) {
				cloth_simulation(o.cloth->points, *o.vertices, simulation_dt, transform_without_translation(inverse(*o.transform), vector3(0.f, 0.f, -9.82f)));
				cloth_springs(o.cloth->springs, o.cloth->points, *o.vertices, 2);
			}
			calc_vertex_normals(*o.vertices, *o.indices);
			_render_buffer->update_buffer(o.vbuffer, o.vertices->size() * sizeof(Vertex), o.vertices->begin());
			Vector3 bv_min = vector3(FLT_MAX, FLT_MAX, FLT_MAX), bv_max = -bv_min;
			calc_bounding_volume(*o.vertices, bv_min, bv_max);
			_mesh_api->set_bounding_box(o.mesh, (float*)&bv_min, (float*)&bv_max);
		}
		_profiler->profile_stop();

		_profiler->profile_start("texture-update");
		{
			mandelbrot(o.texture_data->begin(), o.tview.width, o.tview.height, o.acc_time, 8);
			_render_buffer->update_buffer(o.texture, o.texture_data->size(), o.texture_data->begin());
		}
		_profiler->profile_stop();

	}
}

extern "C" {

	void *get_render_plugin_api(unsigned api)
	{
		if (api == PLUGIN_API_ID) {
			static struct PluginApi api = {0};
			api.get_name = get_name;
			api.setup_game = setup_game;
			api.shutdown_game = shutdown_game;
			api.update_game = update_game;
			return &api;
		}
		return 0;
	}

	#if !defined STATIC_PLUGIN_LINKING
		PLUGIN_DLLEXPORT void *get_plugin_api(unsigned api)
		{
			return get_render_plugin_api(api);
		}
	#endif

}
