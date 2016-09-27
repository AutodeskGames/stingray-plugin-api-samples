# Autodesk® Stingray / Flow Nodes sample plugin
---

This folder contains Stingray Plugin sample showcasing the creation of custom flow nodes inside a engine runtime plugin.

This is a sample plugin that registers two flow nodes.

To allow them to be edited in the editor and compiled properly you need to copy the file "flow_nodes_sample_plugin.flow_node_definitions" to your "core/flow_nodes" folder. You also need to change the ui_scopes section to set in which editors it should show up. Remove the entire ui_scopes section to allow the flow node everywhere.
