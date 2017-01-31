--------------------------------------------------
-- Utility functions
--------------------------------------------------

print('----------- Require smart_move_tool ----------- ');


local install_pivot_behaviors = require "core/editor_slave/stingray_editor/pivot_behaviors"

local boxed_world_position = Func.compose(Func.partial(SceneElementRef.map, Func.method("world_position")), Vector3Box)

local function start_move_selected_elements()
	local is_cloning = LevelEditing:is_clone_modifier_held() and LevelEditing.selection:duplicate()
	local local_start_poses = LevelEditing.selection:save_state()
	local world_start_positions = Array.map(LevelEditing.selection:select_element_refs(), boxed_world_position)
	return local_start_poses, world_start_positions, is_cloning
end

local function delta_move_selected_elements(world_start_positions, offset)
	local scene_element_refs = LevelEditing.selection:select_element_refs()
	local start_positions = Array.map(world_start_positions, Func.method("unbox"))

	for index, scene_element_ref in ipairs(scene_element_refs) do
		local object_id, component_id = SceneElementRef.unpack(scene_element_ref)
		local level_object = LevelEditing.objects[object_id]
		if level_object:is_translatable() then
			level_object:set_world_position(start_positions[index] + offset, component_id)
		end
	end

	LevelEditing.selection:sync_elements_pose()
end

local function finish_move_selected_elements(local_start_poses, is_cloning)
	LevelEditing.selection:finish_move(local_start_poses, is_cloning)
end


--------------------------------------------------
-- MoveTool
--------------------------------------------------

SmartMoveTool = class(SmartMoveTool, Tool)
SmartMoveTool.Behaviors = SmartMoveTool.Behaviors or {}
local Behaviors = SmartMoveTool.Behaviors
install_pivot_behaviors(Behaviors)

function SmartMoveTool:init()
	self._move_gizmo = MoveGizmo()
	self._behavior = Behaviors.Idle()
	self._reference_system = "World"
end

function SmartMoveTool:coordinates()
	return self._behavior:coordinates(self)
end

function SmartMoveTool:update(dt, viewport)
	if self._behavior.update ~= nil then
		self._behavior:update(self, dt, viewport)
	end
end

function SmartMoveTool:render(viewport)
	if not Editor:is_viewport_interacted_with(viewport) then
		return
	end

	if self._behavior.render ~= nil then
		self._behavior:render(self, viewport, self._reference_system)
	end
end

function SmartMoveTool:is_highlight_suppressed()
	return self._behavior.is_highlight_suppressed and self._behavior:is_highlight_suppressed(self) or false
end

function SmartMoveTool:on_deselected()
	if self._behavior.on_deselected ~= nil then
		self._behavior:on_deselected(self)
	end
end

function SmartMoveTool:on_elements_selection_changed()
	self:_align_gizmo()
end

function SmartMoveTool:_align_gizmo()
	local reference_object, component_id = LevelEditing.selection:last_selected_object()
	if reference_object ~= nil then
		-- Update the move gizmo pose from external factors.
		if reference_object:is_translatable() then
			local pivot_pose = reference_object:pivot_pose(component_id)
			local gizmo_pose = self:reference_system() == "World" and Matrix4x4.from_translation(Matrix4x4.translation(pivot_pose)) or pivot_pose
			self._move_gizmo:set_pose(gizmo_pose)
		else
			-- Last object user selected can't have the gizmo on it, so
			-- pick an object at 'random'
			for _, object in pairs(LevelEditing.selection:objects()) do
				if object:is_translatable() then
					component_id = nil
					local pivot_pose = object:pivot_pose(component_id)
					local gizmo_pose = self:reference_system() == "World" and Matrix4x4.from_translation(Matrix4x4.translation(pivot_pose)) or pivot_pose
					self._move_gizmo:set_pose(gizmo_pose)
					break
				end
			end
		end
	end
end

function SmartMoveTool:mouse_down(x, y, viewport)
	print("Smart Move Down")
	if LevelEditing:is_camera_control_modifier_held() then return end

	if self._behavior.mouse_down ~= nil then
		self._behavior:mouse_down(self, x, y, viewport)
	end
end

function SmartMoveTool:mouse_move(x, y, dx, dy, viewport)
	if self._behavior.mouse_move ~= nil then
		self._behavior:mouse_move(self, x, y, dx, dy, viewport)
	end
end

function SmartMoveTool:mouse_up(x, y, viewport)
	if self._behavior.mouse_up ~= nil then
		self._behavior:mouse_up(self, x, y, viewport)
	end
end

function SmartMoveTool:mouse_context(x, y, viewport)
	return LevelEditing.select_tool:selection_could_initiate_drag(x, y, viewport)
end

function SmartMoveTool:keyboard_move(direction)
	if self._behavior.keyboard_move ~= nil then
		self._behavior:keyboard_move(self, direction)
	end
end

function SmartMoveTool:toggle_pivot_edit_mode()
	if self._behavior.toggle_pivot_edit_mode ~= nil then
		self._behavior:toggle_pivot_edit_mode(self)
	end
end

function SmartMoveTool:set_reference_system(reference_name)
	assert(reference_name == "Local" or reference_name == "World")
	self._reference_system = reference_name
end

function SmartMoveTool:reference_system()
	return self._reference_system;
end


--------------------------------------------------
-- Idle behavior
--------------------------------------------------

Behaviors.Idle = class(Behaviors.Idle)

function Behaviors.Idle:init()
end

function Behaviors.Idle:coordinates(tool)
	local position = nil

	if LevelEditing.selection:count() == 0 then
		local hovered_object = LevelEditing:hovered_object()
		position = hovered_object == nil and Vector3(0, 0, 0) or hovered_object:local_position()
	else
		position = tool._move_gizmo:position()
	end

	return position
end

function Behaviors.Idle:update(tool, dt, viewport)
	LevelEditing.select_tool:update(dt, viewport)
end

function Behaviors.Idle:render(tool, viewport, reference_system)
	LevelEditing.select_tool:render(viewport)

	local selection = LevelEditing.selection
	if selection:last_selected_object() == nil then
		return
	end

	if not selection:objects():any(Func.method("is_translatable")) then
		return
	end

	tool._move_gizmo:draw_grid_plane(viewport)
	tool._move_gizmo:draw(viewport, true, reference_system)
end

function Behaviors.Idle:mouse_down(tool, x, y, viewport)
	print("Smart Move Down Behaviors.Idle")

	LevelEditing:abort_physics_simulation()

	if tool._move_gizmo:is_axes_selected() and LevelEditing.selection:count() > 0 then
		if LevelEditing.selection:objects():any(Func.method("is_translatable")) then
			tool._move_gizmo:start_move(viewport:editor_camera(), x, y, viewport:window())
			tool._behavior = Behaviors.DragSelectedObjects()
			LevelEditing:raise_highlight_changed()
		end
	else
		LevelEditing.select_tool:mouse_down(x, y, viewport)
	end
end

function Behaviors.Idle:mouse_move(tool, x, y, dx, dy, viewport)
	LevelEditing.select_tool:mouse_move(x, y, dx, dy, viewport)

	local reference_object, component_id = LevelEditing.selection:last_selected_object()

	if reference_object ~= nil then
		tool:_align_gizmo()
		local mouse_pos = viewport:mouse().pos
		tool._move_gizmo:select_axes(viewport, mouse_pos.x, mouse_pos.y, true)
	end
end

function Behaviors.Idle:mouse_up(tool, x, y, viewport)
	LevelEditing.select_tool:mouse_up(x, y, viewport)
end

function Behaviors.Idle:keyboard_move(tool, direction)
	if LevelEditing.selection:count() == 0 then return end

	local v = direction * LevelEditing.grid.stepsize
	local tm = tool._move_gizmo:pose()
	local offset = Matrix4x4.transform_without_translation(tm, v)
	local local_start_poses, world_start_positions, is_cloning = start_move_selected_elements()
	delta_move_selected_elements(world_start_positions, offset)
	finish_move_selected_elements(local_start_poses, is_cloning)
	tool._move_gizmo:set_position(tool._move_gizmo:position() + offset)
end

function Behaviors.Idle:toggle_pivot_edit_mode(tool)
	local reference_object, component_id = LevelEditing.selection:last_selected_object()

	if reference_object ~= nil then
		tool._behavior = Behaviors.EditPivot(reference_object, component_id)
	end
end


--------------------------------------------------
-- DragSelectedObjects behavior
--------------------------------------------------

Behaviors.DragSelectedObjects = class(Behaviors.DragSelectedObjects)

function Behaviors.DragSelectedObjects:init()
	self._local_start_poses, self._world_start_positions, self._is_cloning = start_move_selected_elements()
	self._selected_ids = Set.of_array(LevelEditing.selection:select_element_refs(), SceneElementRef.object_id)
end

function Behaviors.DragSelectedObjects:coordinates(tool)
	return tool._move_gizmo:position()
end

function Behaviors.DragSelectedObjects:render(tool, viewport)
	if LevelEditing.selection:last_selected_object() == nil then
		return
	end

	tool._move_gizmo:draw_grid_plane(viewport)
	tool._move_gizmo:draw_drag_start(viewport)
	tool._move_gizmo:draw(viewport, true)
end

function Behaviors.DragSelectedObjects:is_highlight_suppressed(tool)
	return false
end

function Behaviors.DragSelectedObjects:on_deselected(tool)
	self:_commit_drag_and_return_to_idle_state(tool)
end

function Behaviors.DragSelectedObjects:mouse_move(tool, x, y, dx, dy, viewport)
	print("Behaviors.DragSelectedObjects:mouse_move");

	local snap_function = LevelEditing:snap_function(tool._move_gizmo:pose(), true, self._selected_ids)
	tool._move_gizmo:delta_move(viewport:editor_camera(), x, y, snap_function, viewport:window())
	delta_move_selected_elements(self._world_start_positions, tool._move_gizmo:drag_delta())
end

function Behaviors.DragSelectedObjects:mouse_up(tool)
	self:_commit_drag_and_return_to_idle_state(tool)
end

function Behaviors.DragSelectedObjects:_commit_drag_and_return_to_idle_state(tool)
	finish_move_selected_elements(self._local_start_poses, self._is_cloning)
	tool._behavior = Behaviors.Idle()
	LevelEditing:raise_highlight_changed()
end
