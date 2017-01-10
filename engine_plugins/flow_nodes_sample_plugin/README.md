# Autodesk® Stingray / Flow Nodes sample plugin
---

This folder contains Stingray Plugin sample showcasing the creation of custom flow nodes inside a engine runtime plugin.

This is a sample plugin that registers flow nodes nodes showcasing how to add flow implementations as a runtime plugin. Don't rely on the implementations do something actually useful, the code is only provieded as a sample.
Some of the nodes have their ui_scopes set so they are not visible in any editor by default ("sample_flow_node" and "profiler"). The "Dragon" category of flow nodes show how you can use custom data fields as input/output to flow nodes.

This plugin has a corresponding editor plugin part which contains the mapping of flow_node_definition file so they can be used in the editor and properly compiled. the flow_node_definition file is not needed to run your compiled project.
