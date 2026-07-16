// backend/routes/notifications.js
import express from 'express';
import supabase from '../config/supabase.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// GET /api/notifications - Get all notifications for admin
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { limit = 20, offset = 0, unread_only = false } = req.query;

    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (unread_only === 'true') {
      query = query.eq('read', false);
    }

    const { data: notifications, error, count } = await query
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (error) throw error;

    // Get unread count
    const { count: unreadCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('read', false);

    res.json({
      success: true,
      notifications: notifications || [],
      unread_count: unreadCount || 0,
      total: count || 0,
      page: Math.floor(Number(offset) / Number(limit)) + 1,
      totalPages: Math.ceil((count || 0) / Number(limit)),
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/notifications/:id/read - Mark notification as read
router.put('/:id/read', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('notifications')
      .update({ 
        read: true,
        read_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, notification: data });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/notifications/read-all - Mark all notifications as read
router.put('/read-all', authenticate, requireAdmin, async (req, res) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ 
        read: true,
        read_at: new Date().toISOString()
      })
      .eq('read', false);

    if (error) throw error;
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/notifications/:id - Delete a notification
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/notifications - Delete all read notifications
router.delete('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('read', true);

    if (error) throw error;
    res.json({ success: true, message: 'All read notifications deleted' });
  } catch (error) {
    console.error('Error deleting read notifications:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;