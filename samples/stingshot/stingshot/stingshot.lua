local get_focus_viewport = function ()
    local focused_viewport = Editor:focused_viewport()
    if not focused_viewport then loginfo('No focus viewport', 'Stingshot', 'warning'); return nil end
    return focused_viewport
end

local get_focus_viewport_window = function ()
    local focused_viewport = get_focus_viewport()
    local viewport_window = focused_viewport._window
    if not viewport_window then loginfo('No window for viewport', 'Stingshot', 'warning'); return nil end
    return viewport_window
end

Stingshot = Stingshot or {}

function Stingshot.remove_focus_viewport_hud()
    local focused_viewport = get_focus_viewport()
    if not focused_viewport then return end

    -- Remove HUD elements
    if focused_viewport._toolbar_behavior then
        focused_viewport._toolbar_behavior._visible = false
    end

    Stingshot.had_gizmos = focused_viewport:are_gizmos_visible()
    if Stingshot.had_gizmos then
        focused_viewport:set_gizmo_visibiliy(false)
    end

    Stingshot.old_line_dispatch = LineObject.dispatch
    LineObject.dispatch = function () end
    Stingshot.old_level_editing_tool = LevelEditing.tool
    Stingshot.last_selected_objects = LevelEditing.selection:select_element_refs()
    LevelEditing.tool = Tool()
    LevelEditing.selection:clear()
end

function Stingshot.restore_focus_viewport_hud()
    local focused_viewport = get_focus_viewport()
    if not focused_viewport then return end
    if focused_viewport._toolbar_behavior then
        focused_viewport._toolbar_behavior._visible = true
    end
    if Stingshot.had_gizmos then
        focused_viewport:set_gizmo_visibiliy(true)
    end
    LevelEditing.tool = Stingshot.old_level_editing_tool
    LevelEditing.selection:preselect_add(Stingshot.last_selected_objects, #Stingshot.last_selected_objects)
    LineObject.dispatch = Stingshot.old_line_dispatch
end

function Stingshot.take_focus_viewport_screenshot()
    local viewport_window = get_focus_viewport_window()
    if not viewport_window then return end

    local w, h = Application.back_buffer_size(viewport_window)
    FrameCapture.thumbnail(ConsoleServer.current_client_id(), viewport_window, "back_buffer", 42, w, h)
end
