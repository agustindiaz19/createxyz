import { supabase } from '../lib/supabase';

// Service to handle collections
export const collectionsService = {
  // Get all collections
  async getAllCollections() {
    const { data, error } = await supabase
      .from('collections')
      .select(`
        *,
        boxes (
          id,
          name,
          latitude,
          longitude
        )
      `)
      .order('collected_at', { ascending: false });

    if (error) {
      console.error('Error fetching collections:', error);
      throw new Error('Failed to fetch collections');
    }

    return data || [];
  },

  // Get collections by collector
  async getCollectionsByCollector(collectorId) {
    const { data, error } = await supabase
      .from('collections')
      .select(`
        *,
        boxes (
          id,
          name,
          latitude,
          longitude
        )
      `)
      .eq('collector_id', collectorId)
      .order('collected_at', { ascending: false });

    if (error) {
      console.error('Error fetching collections by collector:', error);
      throw new Error('Failed to fetch collections');
    }

    return data || [];
  },

  // Get collections by box
  async getCollectionsByBox(boxId) {
    const { data, error } = await supabase
      .from('collections')
      .select('*')
      .eq('box_id', boxId)
      .order('collected_at', { ascending: false });

    if (error) {
      console.error('Error fetching collections by box:', error);
      throw new Error('Failed to fetch collections');
    }

    return data || [];
  },

  // Create a collection (marcar caja como recolectada)
  async createCollection(boxId, containersCollected, notes = null) {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Obtener información de la caja antes de vaciarla
    const { data: box, error: boxError } = await supabase
      .from('boxes')
      .select('*')
      .eq('id', boxId)
      .single();

    if (boxError || !box) {
      throw new Error('Box not found');
    }

    const containersBefore = box.current_containers;
    const containersAfter = 0; // Vaciar la caja

    // Crear la recolección
    const { data: collection, error: collectionError } = await supabase
      .from('collections')
      .insert([{
        collector_id: user.id,
        box_id: boxId,
        containers_collected: containersCollected,
        containers_before: containersBefore,
        containers_after: containersAfter,
        notes: notes,
      }])
      .select()
      .single();

    if (collectionError) {
      console.error('Error creating collection:', collectionError);
      throw new Error('Failed to create collection');
    }

    // Vaciar la caja (actualizar current_containers a 0)
    const { error: updateError } = await supabase
      .from('boxes')
      .update({ current_containers: containersAfter })
      .eq('id', boxId);

    if (updateError) {
      console.error('Error updating box after collection:', updateError);
      // Intentar eliminar la recolección si falla la actualización
      await supabase.from('collections').delete().eq('id', collection.id);
      throw new Error('Failed to update box after collection');
    }

    return collection;
  },

  // Get statistics
  async getStatistics(collectorId = null) {
    let query = supabase
      .from('collections')
      .select('containers_collected, collected_at');

    if (collectorId) {
      query = query.eq('collector_id', collectorId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching statistics:', error);
      throw new Error('Failed to fetch statistics');
    }

    const collections = data || [];
    
    // Estadísticas totales
    const totalCollections = collections.length;
    const totalContainers = collections.reduce((sum, c) => sum + (c.containers_collected || 0), 0);

    // Estadísticas por día (últimos 7 días)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const last7Days = collections.filter(c => {
      const collectedDate = new Date(c.collected_at);
      collectedDate.setHours(0, 0, 0, 0);
      const daysDiff = (today - collectedDate) / (1000 * 60 * 60 * 24);
      return daysDiff >= 0 && daysDiff < 7;
    });

    const todayCollections = collections.filter(c => {
      const collectedDate = new Date(c.collected_at);
      collectedDate.setHours(0, 0, 0, 0);
      return collectedDate.getTime() === today.getTime();
    });

    const todayContainers = todayCollections.reduce((sum, c) => sum + (c.containers_collected || 0), 0);

    return {
      totalCollections,
      totalContainers,
      todayCollections: todayCollections.length,
      todayContainers,
      last7DaysCollections: last7Days.length,
    };
  },
};

