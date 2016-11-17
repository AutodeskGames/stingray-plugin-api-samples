#pragma once

#include "c_api_types.h"

#ifdef __cplusplus
extern "C" {
#endif

struct TextExtentsResult
{
	struct CApiVector2 min;
	struct CApiVector2 max;
	struct CApiVector2 caret;
};

struct GuiCApi
{
	unsigned (*triangle) (GuiPtr, ConstVector3Ptr p0, ConstVector3Ptr p1, ConstVector3Ptr p2, unsigned layer, ConstVector4Ptr optional_color,
						  MaterialPtr optional, ConstVector2Ptr optional_uv0, ConstVector2Ptr optional_uv1, ConstVector2Ptr optional_uv2);
	void	 (*update_triangle) (GuiPtr, unsigned id, ConstVector3Ptr p0, ConstVector3Ptr p1, ConstVector3Ptr p2, unsigned layer, ConstVector4Ptr optional_color);
	void	 (*destroy_triangle) (GuiPtr, unsigned id);

	unsigned (*rect) (GuiPtr, ConstVector2Ptr position, unsigned layer, ConstVector2Ptr size, ConstVector4Ptr optional_color);
	void	 (*update_rect) (GuiPtr, unsigned id, ConstVector2Ptr position, unsigned layer, ConstVector2Ptr size, ConstVector4Ptr optional_color);
	void	 (*destroy_rect) (GuiPtr, unsigned id);

	unsigned (*rect_3d) (GuiPtr, ConstMatrix4x4Ptr transform, ConstVector3Ptr position, unsigned layer, ConstVector2Ptr size, ConstVector4Ptr optional_color);
	void	 (*update_rect_3d) (GuiPtr, unsigned id, ConstMatrix4x4Ptr transform, ConstVector3Ptr position, unsigned layer, ConstVector2Ptr size, ConstVector4Ptr optional_color);
	void	 (*destroy_rect_3d) (GuiPtr, unsigned id);

	unsigned (*bitmap) (GuiPtr, MaterialPtr, ConstVector2Ptr position, unsigned layer, ConstVector2Ptr size, ConstVector4Ptr optional_color, ConstVector2Ptr optional_uv00, ConstVector2Ptr optional_uv11);
	void	 (*update_bitmap) (GuiPtr, unsigned id, MaterialPtr, ConstVector2Ptr position, unsigned layer,
				ConstVector2Ptr size, ConstVector4Ptr optional_color, ConstVector2Ptr optional_uv00, ConstVector2Ptr optional_uv11);
	void	 (*destroy_bitmap) (GuiPtr, unsigned id);

	unsigned (*bitmap_3d) (GuiPtr, ConstMatrix4x4Ptr transform, MaterialPtr, ConstVector2Ptr position, unsigned layer, ConstVector2Ptr size,
				ConstVector4Ptr optional_color, ConstVector2Ptr optional_uv00, ConstVector2Ptr optional_uv11);
	void	 (*update_bitmap_3d) (GuiPtr, unsigned id, ConstMatrix4x4Ptr transform, MaterialPtr, ConstVector2Ptr position, unsigned layer,
				ConstVector2Ptr size, ConstVector4Ptr optional_color, ConstVector2Ptr optional_uv00, ConstVector2Ptr optional_uv11);
	void	 (*destroy_bitmap_3d) (GuiPtr, unsigned id);


	unsigned (*text) (GuiPtr, const char* text, uint64_t font, float font_size, MaterialPtr, ConstVector2Ptr position, unsigned layer, float letter_spacing, ConstVector4Ptr optional_color);
	void	 (*update_text) (GuiPtr, unsigned id, const char* text, uint64_t font, float font_size, MaterialPtr, ConstVector2Ptr position, unsigned layer, float letter_spacing, ConstVector4Ptr optional_color);
	void	 (*destroy_text) (GuiPtr, unsigned id);

	unsigned (*text_3d) (GuiPtr, const char* text_3d, uint64_t font, float font_size, MaterialPtr, ConstMatrix4x4Ptr transform,
				ConstVector3Ptr position, unsigned layer, ConstVector4Ptr optional_color, float letter_spacing);
	void	 (*update_text_3d) (GuiPtr, unsigned id, const char* text, uint64_t font, float font_size, MaterialPtr, ConstMatrix4x4Ptr transform,
				ConstVector3Ptr position, unsigned layer, ConstVector4Ptr optional_color, float letter_spacing);
	void	 (*destroy_text_3d) (GuiPtr, unsigned id);

	struct TextExtentsResult (*text_extents) (GuiPtr, const char* text, uint64_t font, float font_size, float letter_spacing);

	/*	Fills the row_length_buffer with the length of each row after having processed the text with word wrapping.
		Returns the total number of rows.	*/
	unsigned (*word_wrap) (GuiPtr, const char* text, uint64_t font, float font_size, float width, const char* whitespace,
		const char* soft_dividers, const char* return_dividers, float letter_spacing, unsigned* row_length_buffer, unsigned buffer_size);

	void	(*set_visible) (GuiPtr, int visible);
	int		(*is_visible) (GuiPtr);

	MaterialPtr (*material) (GuiPtr, uint64_t material_id64, const char *optional_debug_material_name);

	int		(*has_all_glyphs) (GuiPtr, const char* text, uint64_t font);
	void	(*move) (GuiPtr, float x, float y);
	void	(*move_3d) (GuiPtr, ConstMatrix4x4Ptr transform);
	void	(*reset) (GuiPtr);

	CApiVector2		(*resolution) (ViewportPtr optional_viewport, ConstWindowPtr optional_window);
	CApiMatrix4x4	(*rotation_2d) (ConstVector2Ptr position_pointer, float angle, ConstVector2Ptr optional_pivot);

	/*	Equivalent to vector4(255, r, g, b).	*/
	CApiVector4	(*color_rgb) (float r, float g, float b);
	/*	Equivalent to vector4(a, r, g, b).		*/
	CApiVector4	(*color_argb) (float a, float r, float g, float b);


	/*	Not available in Release builds.	*/
	CApiVector2 (*texture_size) (uint64_t resource_id64);
};

#ifdef __cplusplus
}
#endif
