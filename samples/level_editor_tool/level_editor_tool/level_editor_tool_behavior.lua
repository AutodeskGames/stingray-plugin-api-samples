require 'level_editor_tool/smart_move_tool'

print("-- level_editor_tool_behavior Setup --");

SmartMoveToolCtrl = SmartMoveToolCtrl or {}

function SmartMoveToolCtrl.injectCustomTool()
    if getmetatable(LevelEditing.movel_tool) ~= SmartMoveTool then
		print('---- Injecting smart Move tool ----');

		local overrideCurrentTool = LevelEditing.tool == LevelEditing.movel_tool;
		LevelEditing.move_tool = SmartMoveTool();

		if overrideCurrentTool then
			LevelEditing:set_tool(LevelEditing.move_tool);
		end
	end
end

function SmartMoveToolCtrl.updateToolProperty(property, value)
	print('property changed: ', property, "- value: ", value)
end

SmartMoveToolCtrl.injectCustomTool()
