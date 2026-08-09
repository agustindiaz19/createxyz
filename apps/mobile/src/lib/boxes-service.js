import { supabase } from '../lib/supabase';

// Service to handle boxes
export const boxesService = {
  // Get all boxes
  async getAllBoxes() {
    const { data, error } = await supabase
      .from('boxes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching boxes:', error);
      throw new Error('Failed to fetch boxes');
    }

    return data || [];
  },

  // Create a new box
  async createBox(boxData) {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('boxes')
      .insert([{
        user_id: user.id,
        latitude: boxData.latitude,
        longitude: boxData.longitude,
        current_containers: boxData.current_containers || 0,
        max_containers: boxData.max_containers || 10,
        name: boxData.name || null,
        description: boxData.description || null,
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating box:', error);
      throw new Error('Failed to create box');
    }

    return data;
  },

  // Update a box
  async updateBox(id, updates) {
    const { data, error } = await supabase
      .from('boxes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating box:', error);
      throw new Error('Failed to update box');
    }

    return data;
  },

  // Delete a box
  async deleteBox(id) {
    const { error } = await supabase
      .from('boxes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting box:', error);
      throw new Error('Failed to delete box');
    }

    return true;
  },
};
