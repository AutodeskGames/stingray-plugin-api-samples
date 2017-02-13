-- Gather asset statistics
--

--noinspection GlobalCreationOutsideO
DreamStats = DreamStats or {}

local Window = stingray.Window
local World = stingray.World
local Application = stingray.Application
local Viewport = stingray.Viewport
local Gui = stingray.Gui
local FrameCapture = stingray.FrameCapture
local Unit = stingray.Unit
local Camera = stingray.Camera
local ShadingEnvironment = stingray.ShadingEnvironment

local WINDOW_SIZE = 256
local RENDER_FRAME_COUNT = 4

DreamStats.requests = {}
DreamStats.current_request = nil
DreamStats.orig_render_func = nil

local StatsGenerators = StatsGenerators or {}

---------------------------------------------------------------------------

local BaseStatsGenerator = class(BaseStatsGenerator)

function BaseStatsGenerator:init(req)
    self._request = req
    self._resource_name = req.name
    self._frame_count = 0

    -- Create rendering window
    self._window = Window.open{ visible = false, explicit_resize = false,
        title = "dream stats - " .. self._resource_name, width = WINDOW_SIZE, height = WINDOW_SIZE }
    Window.set_resolution(self._window, WINDOW_SIZE, WINDOW_SIZE)
    Window.set_show_cursor(self._window, true, false)
    Window.set_clip_cursor(self._window, false)

    self._world = Application.new_world(stingray.Application.DISABLE_APEX_CLOTH)
    self._viewport = Application.create_viewport(self._world, "default")
    self._camera_unit = World.spawn_unit(self._world, "core/units/camera")
    self._camera = Unit.camera(self._camera_unit, "camera")
    self._shading_environment = World.create_shading_environment(self._world)

    Unit.set_unit_visibility(self._camera_unit, false)

    World.set_flow_enabled(self._world, false)
    World.set_editor_flow_enabled(self._world, false)
end

function BaseStatsGenerator:prepare()
    local maxw, maxh = Gui.resolution(self._viewport, self._window)

    -- Make sure the back buffer is large enough to render the requested size
    local cw, ch = Gui.resolution(self._viewport, self._window)
    local dim = math.max(self._request.w, self._request.h)
    if math.min(cw, ch) < dim then
        Window.set_resolution(self._window, dim, dim)
    end

    Viewport.set_rect(self._viewport, 0, 0, self._request.w / maxw, self._request.h / maxh)

    World.update_unit(self._world, self._camera_unit)
end

function BaseStatsGenerator:render(reqw, reqh)
    local dt = 1 / 60
    local maxw, maxh = Gui.resolution(self._viewport, self._window)

    World.update(self._world, dt)

    ShadingEnvironment.blend(self._shading_environment, {"default", 1})
    ShadingEnvironment.apply(self._shading_environment)
    Application.render_world(self._world, self._camera, self._viewport, self._shading_environment, self._window)

    -- Note that this function will always send the subrect of the requested buffer counted from the top-left corner
    FrameCapture.thumbnail(self._request.client_id, self._window, "back_buffer", self._request.id, math.min(maxw, reqw), math.min(maxh, reqh))

    self._frame_count = self._frame_count + 1
end

function BaseStatsGenerator:is_finished()
    return self._frame_count > RENDER_FRAME_COUNT
end

function BaseStatsGenerator:cleanup()
    if self._camera_unit then World.destroy_unit(self._world, self._camera_unit) end
    if self._shading_environment then World.destroy_shading_environment(self._world, self._shading_environment) end
    if self._viewport then Application.destroy_viewport(self._world, self._viewport) end
    if self._world then Application.release_world(self._world) end
    if self._window then Window.close(self._window) end

    self._window = nil
    self._world = nil
    self._viewport = nil
    self._camera_unit = nil
    self._shading_environment = nil
end

---------------------------------------------------------------------------

local UnitStatsGenerator = class(UnitStatsGenerator, BaseStatsGenerator)

function UnitStatsGenerator:init(req)
    BaseStatsGenerator.init(self, req)

    local unit = self._resource_name
    assert(unit)

    self._unit = World.spawn_unit(self._world, unit)
    if Unit.has_visibility_group(self._unit, "gizmo") then
        Unit.set_visibility(self._unit, "gizmo", false)
    end
    Unit.disable_physics(self._unit)
end

function UnitStatsGenerator:get_unit_stats(current_unit)
    return {
        num_meshes = stingray.Unit.num_meshes(current_unit),
        num_nodes = stingray.Unit.num_scene_graph_items(current_unit),
        num_terrains = stingray.Unit.num_terrains(current_unit),
        num_lights = stingray.Unit.num_terrains(current_unit)
    }
end

function UnitStatsGenerator:find_viewport_framing(pose, radius, window)
    local function distance_along_ray(ray_start, ray_dir, point_a, point_b)
        local at = Vector3.dot(point_a - ray_start, ray_dir)
        local bt = Vector3.dot(point_b - ray_start, ray_dir)
        return math.abs(bt - at)
    end

    local function camera_fov(camera, window)
        -- Assumes square pixels.
        local width, height = Application.back_buffer_size(window)
        local vertical_fov = Camera.vertical_fov(camera)
        local horizontal_fov = vertical_fov * width / height
        return horizontal_fov, vertical_fov
    end

    local box_center = Matrix4x4.translation(pose)
    local camera_pose = Camera.local_pose(self._camera)
    local box_to_camera_dir = -Matrix4x4.y(camera_pose)

    local camera_position = Matrix4x4.translation(camera_pose)
    local horizontal_distance = Func.partial(distance_along_ray, camera_position, Matrix4x4.x(camera_pose))
    local vertical_distance = Func.partial(distance_along_ray, camera_position, Matrix4x4.z(camera_pose))

    local box_points = OOBB.points(pose, radius)
    local projections_on_line = Array.map(box_points, function(pt) return Vector3.dot(pt - box_center, box_to_camera_dir) end)
    local horizontal_distances_to_line = Array.mapi(box_points, function(i, pt) return horizontal_distance(pt, projections_on_line[i] * box_to_camera_dir + box_center) end)
    local vertical_distances_to_line = Array.mapi(box_points, function(i, pt) return vertical_distance(pt, projections_on_line[i] * box_to_camera_dir + box_center) end)

    local horizontal_fov, vertical_fov = camera_fov(self._camera, window)
    local required_distances_to_fit_horizontally = Array.mapi(horizontal_distances_to_line, function(i, d) return projections_on_line[i] + d / math.tan(horizontal_fov / 2) end)
    local required_distances_to_fit_vertically = Array.mapi(vertical_distances_to_line, function(i, d) return projections_on_line[i] + d / math.tan(vertical_fov / 2) end)
    local _, required_horizontal_distance = required_distances_to_fit_horizontally:max()
    local _, required_vertical_distance = required_distances_to_fit_vertically:max()

    local min_distance = Camera.near_range(self._camera) + Vector3.length(radius)

    local interest_point_distance = math.max(min_distance, required_horizontal_distance, required_vertical_distance)
    local framing_camera_position = box_center + box_to_camera_dir * interest_point_distance
    return framing_camera_position, interest_point_distance
end

function UnitStatsGenerator:frame_oobb_instantly(pose, radius, window)
    local target_camera_position = self:find_viewport_framing(pose, radius, window)
    local camera_pose = Camera.local_pose(self._camera)
    Matrix4x4.set_translation(camera_pose, target_camera_position)
    Camera.set_local_pose(self._camera, self._camera_unit, camera_pose)
end

function UnitStatsGenerator:render(reqw, reqh)
    local function get_unit_oobb_or_default(unit)
        if unit ~= nil then
            return Unit.box(unit)
        else
            return Matrix4x4.identity(), Vector3(1, 1, 1)
        end
    end

    local tm, radius = get_unit_oobb_or_default(self._unit)
    self:frame_oobb_instantly(tm, radius * 1.02, self._window)

    -- Turn object around a bit
    local adjustment_rotation = Quaternion.axis_angle(Vector3(0,0,1), self._frame_count * 45)
    local q_rot = Quaternion.identity()
    q_rot = Quaternion.multiply(q_rot, adjustment_rotation)
    Unit.set_local_rotation(self._unit, 1, q_rot)

    World.update_unit(self._world, self._unit)

    return BaseStatsGenerator.render(self, reqw, reqh)
end

function UnitStatsGenerator:fetch_stats()
    return {
        unit_stats = self:get_unit_stats(self._unit),
        render_stats = stingray.Profiler.render_stats(self._window)
    }
end

function UnitStatsGenerator:cleanup()
    World.destroy_unit(self._world, self._unit)

    self._unit = nil

    BaseStatsGenerator.cleanup(self)
end

---------------------------------------------------------------------------

local report_error = function (id, err)
    stingray.Application.console_send({
        type = "dream-stats-asset",
        id = id,
        err = err
    })
end

local report_stats = function (id, stats)
    stingray.Application.console_send({
        type = "dream-stats-asset",
        id = id,
        stats = stats
    })
end

local construct = function (req)
    req.obj = StatsGenerators[req.class](req)
    assert(req.obj)
end

local poll_request = function (requests)
    local req = table.remove(requests)
    while req ~= nil do
        local constructor = StatsGenerators[req.class]
        local is_dds = req.class == "dds" and file_exists(req.absolute_path)
        local is_valid = constructor ~= nil and (Application.can_get(req.class, req.name) or is_dds)

        if is_valid then
            return req
        end

        report_error(req.id, "Invalid request")
        req = table.remove(requests)
    end
    return nil
end

local process_requests = function ()

    if not DreamStats.current_request then
        local req = poll_request(DreamStats.requests)
        if req then
            construct(req)
            req.obj:prepare()
            DreamStats.current_request = req
        end
    end

    if DreamStats.current_request then
        local req = DreamStats.current_request
        req.obj:render(req.w, req.h)

        if req.obj:is_finished() then
            report_stats(req.id, req.obj:fetch_stats())
            req.obj:cleanup()
            DreamStats.current_request = nil
        end
    end

    --DreamStats.orig_render_func()
end

local generate = function (rname, rtype, id, w, h)
    local scoped_autoload = Application.begin_scoped_autoload()
    if not Application.can_get(rtype, rname) then
        report_error(id, "Cannot get resource " .. rname .. "." .. rtype)
        return Application.end_scoped_autoload(scoped_autoload)
    end

    local client_id = ConsoleServer.current_client_id();
    table.insert(DreamStats.requests, {class = rtype, name = rname, id = id, w = w, h = h, client_id = client_id})
    Application.end_scoped_autoload(scoped_autoload)
end

local initialize = function ()
    -- Set stats generator per resource types
    StatsGenerators.unit = UnitStatsGenerator

    return DreamStats
end

function DreamStats.start()
    DreamStats.orig_render_func = render
    --noinspection GlobalCreationOutsideO
    render = process_requests
end

function DreamStats.stop()
    if DreamStats.orig_render_func then
        --noinspection GlobalCreationOutsideO
        render = DreamStats.orig_render_func
        DreamStats.orig_render_func = nil
    end
end

function DreamStats.evaluate(id, resource_name, resource_type)
    print ("Computing some stats for `" .. resource_name .. "." .. resource_type .. "`")
    generate(resource_name, resource_type, id, WINDOW_SIZE, WINDOW_SIZE)
end

initialize()
