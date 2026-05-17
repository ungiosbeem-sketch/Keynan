// ============ ROUTINE FUNCTIONS ============
export const getRoutine = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('routines')
      .select('*')
      .eq('user_id', userId)
      .order('time', { ascending: true });
    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updateRoutine = async (routineId, completed) => {
  try {
    const { error } = await supabase
      .from('routines')
      .update({ completed, updated_at: new Date().toISOString() })
      .eq('id', routineId);
    if (error) throw error;
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ============ SCHOOL FUNCTIONS ============
export const getSchedule = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('schedule')
      .select('*')
      .eq('user_id', userId)
      .order('day', { ascending: true });
    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const addHomework = async (homework) => {
  try {
    const { error } = await supabase.from('homework').insert([homework]);
    if (error) throw error;
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ============ READING FUNCTIONS ============
export const getBooks = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .eq('user_id', userId);
    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updateBookProgress = async (bookId, currentPage) => {
  try {
    const { error } = await supabase
      .from('books')
      .update({ current_page: currentPage, updated_at: new Date().toISOString() })
      .eq('id', bookId);
    if (error) throw error;
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
