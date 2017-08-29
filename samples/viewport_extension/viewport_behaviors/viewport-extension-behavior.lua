local ViewportExtensionTestBehavior = class(ViewportExtensionTestBehavior)

require "core/editor_slave/stingray_editor/gizmo_manager"

function ViewportExtensionTestBehavior:init(id, editor, window)
    self._id = id
    self._event_handlers = {}
    self._editor = editor
    self._does_accept_dnd = false
    self._window = window
    self._world = Application.new_world()
    self._viewport = Application.create_viewport(self._world, "default")
    self._editor_camera = EditorCamera.create_viewport_editor_camera(id, self._world, {"QuakeStyleMouseLook"})
    self._shading_environment = World.create_shading_environment(self._world)
    self._is_dirty = true

    -- Easy way to manage background level
    self._gizmo_manager = GizmoManager()

    self:on("load_background_level")
end

function ViewportExtensionTestBehavior:on(method_name)
    local off_callback_handler = self._editor:on(self._id, method_name, Func.method(method_name, self))
    self._event_handlers[method_name] = off_callback_handler
    return off_callback_handler
end

function ViewportExtensionTestBehavior:off(method_name, callback)
    self._event_handlers[method_name] = nil
    self._editor:off(self._id, method_name, callback)
end

-- Required
function ViewportExtensionTestBehavior:render(editor_viewport, lines, lines_no_z)
    if self._shading_environment ~= nil then
        ShadingEnvironment.blend(self._shading_environment, {"default", 1})
        ShadingEnvironment.apply(self._shading_environment)
    end

    LineObject.dispatch(self._world, lines)
    LineObject.dispatch(self._world, lines_no_z)

    if self._window ~= nil then
        Application.render_world(self._world, self._editor_camera:camera(), self._viewport, self._shading_environment, self._window)
    else
        Application.render_world(self._world, self._editor_camera:camera(), self._viewport, self._shading_environment)
    end
end
function ViewportExtensionTestBehavior:is_accepting_drag_and_drop() return self._does_accept_dnd end
function ViewportExtensionTestBehavior:world() return self._world end
function ViewportExtensionTestBehavior:editor_camera() return self._editor_camera end
function ViewportExtensionTestBehavior:selected_units() return {} end
function ViewportExtensionTestBehavior:shading_environment() return self._shading_environment end

-- Optional
function ViewportExtensionTestBehavior:update(editor_viewport, dt)
    self._gizmo_manager:update_gizmos(self._editor_camera:camera())
    World.update(self._world, dt)
end

function ViewportExtensionTestBehavior:shutdown()
    self:off(self._id, "load_background_level")
    self._gizmo_manager:clear()

    Application.destroy_viewport(self._world, self._viewport)
    World.destroy_shading_environment(self._world, self._shading_environment)
    Application.release_world(self._world)
end

function ViewportExtensionTestBehavior:reset()-- Called at editor start and at every level change.
    self._viewport = Application.create_viewport(self._world, "default")
end

function ViewportExtensionTestBehavior:activated() end

function set_cursor(resource) 
    print('Setting cursor from lua: ' .. resource);

    Window.set_cursor(resource)
    Application.console_send({
        type = "sync_engine_cursor",
        cursor = resource
    })

end

function ViewportExtensionTestBehavior:key_down(key)
    if (key == 49 ) then
        set_cursor("viewport_behaviors/pan")
    elseif (key == 50) then
        set_cursor("viewport_behaviors/look_around")
    elseif (key == 51) then
        set_cursor("viewport_behaviors/orbit")
    elseif (key == 52) then
        set_cursor("viewport_behaviors/wall")
    end
end

function ViewportExtensionTestBehavior:key_up(key)
end

function ViewportExtensionTestBehavior:mouse_move(x, y, dx, dy, viewport) end
function ViewportExtensionTestBehavior:mouse_left_down(x, y, viewport)
end
function ViewportExtensionTestBehavior:mouse_left_up(x, y, viewport) end
function ViewportExtensionTestBehavior:mouse_middle_down(x, y, viewport) end
function ViewportExtensionTestBehavior:mouse_middle_up(x, y, viewport) end
function ViewportExtensionTestBehavior:mouse_right_down(x, y, viewport) end
function ViewportExtensionTestBehavior:mouse_right_up(x, y, viewport) end
function ViewportExtensionTestBehavior:mouse_wheel(delta, steps, viewport) end
function ViewportExtensionTestBehavior:is_dirty() return self._is_dirty end
function ViewportExtensionTestBehavior:grid() return grid end
function ViewportExtensionTestBehavior:toolbar_behavior() return toolbar_behavior end
function ViewportExtensionTestBehavior:set_skydome_unit(unit)
    if self._skydome_unit then
        World.destroy_unit(self._world, self._skydome_unit)
        self._skydome_unit = nil
    end

    if unit ~= "" then
        self._skydome_unit = World.spawn_unit(self._world, unit)
    end
end
function ViewportExtensionTestBehavior:set_shading_environment(shading_environment)
    World.set_shading_environment(self._world, self._shading_environment, shading_environment)
end
function ViewportExtensionTestBehavior:pre_render(viewport)
    self._editor_camera:pre_render()
end
function ViewportExtensionTestBehavior:post_render(viewport) end

function ViewportExtensionTestBehavior:load_background_level(level_name)
    if self._skydome_unit then
        World.destroy_unit(self._world, self._skydome_unit)
        self._skydome_unit = nil
    end

    if self._background_level ~= nil then
        self._gizmo_manager:unregister_level(self._background_level)
        World.destroy_level(self._world, self._background_level)
        self._background_level = nil, nil
    end

    self._background_level = World.load_level(self._world, level_name)
    Level.spawn_background(self._background_level)
    Level.trigger_level_loaded(self._background_level)

    self._gizmo_manager:register_level(self._background_level)

    if Level.has_data(self._background_level, "shading_environment") then
        World.set_shading_environment(self._world, self._shading_environment, Level.get_data(self._background_level, "shading_environment"))
    end

    return self._background_level;
end

return ViewportExtensionTestBehavior
