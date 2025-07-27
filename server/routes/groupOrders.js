const express = require('express');
const router = express.Router();
const GroupOrder = require('../models/GroupOrder');

// POST /api/grouporders - create new group order
router.post('/', async (req, res) => {
  try {
    const { creatorId, items, totalQuantity, creatorQuantity, deadline, deliveryArea, maxParticipants } = req.body;
    console.log('Creating group order with data:', { creatorId, items, totalQuantity, creatorQuantity, deadline, deliveryArea, maxParticipants });
    
    if (!creatorId || !items || !totalQuantity || !creatorQuantity || !deadline || !deliveryArea) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    if (creatorQuantity > totalQuantity) {
      return res.status(400).json({ message: 'Creator quantity cannot exceed total quantity' });
    }
    
    const groupOrder = new GroupOrder({
      creatorId,
      items,
      totalQuantity,
      creatorQuantity,
      deadline,
      deliveryArea,
      maxParticipants: maxParticipants || 10,
      participants: [{
        userId: creatorId,
        quantity: creatorQuantity
      }] // Creator is automatically a participant
    });
    
    console.log('Group order object before save:', groupOrder);
    await groupOrder.save();
    console.log('Group order saved successfully:', groupOrder._id);
    res.status(201).json({ message: 'Group order created successfully', groupOrder });
  } catch (error) {
    console.error('Error creating group order:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/grouporders - get all active group orders
router.get('/', async (req, res) => {
  try {
    const { creatorId } = req.query;
    const now = new Date();
    let query = { 
      deadline: { $gt: now },
      status: 'active'
    };
    
    if (creatorId) {
      query.creatorId = creatorId;
    }
    
    console.log('Fetching all groups with query:', query);
    const groupOrders = await GroupOrder.find(query)
      .populate('creatorId', 'name email')
      .populate('participants.userId', 'name email')
      .sort({ deadline: 1 });
    
    console.log('Total groups found:', groupOrders.length);
    res.json(groupOrders);
  } catch (error) {
    console.error('Error fetching group orders:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/grouporders/my-groups/:userId - get groups where user is creator or participant
router.get('/my-groups/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const now = new Date();
    const myGroups = await GroupOrder.find({ 
      $or: [
        { creatorId: userId },
        { 'participants.userId': userId },
        { supplierId: userId }
      ]
    })
    .populate('creatorId', 'name email')
    .populate('participants.userId', 'name email')
    .populate('supplierId', 'name email')
    .sort({ deadline: 1 });
    
    res.json(myGroups);
  } catch (error) {
    console.error('Error fetching my groups:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/grouporders/available/:userId - get groups available to join (not created by user)
router.get('/available/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('Fetching available groups for userId:', userId);
    const now = new Date();
    console.log('Current time:', now);
    
    const availableGroups = await GroupOrder.find({ 
      creatorId: { $ne: userId },
      // deadline: { $gt: now }, // Temporarily commented out for testing
      status: 'active'
    })
    .populate('creatorId', 'name email')
    .populate('participants.userId', 'name email')
    .sort({ deadline: 1 });
    
    console.log('Found groups before filtering:', availableGroups.length);
    
    // Filter out groups where user is already a participant
    console.log('Available groups before filtering:', availableGroups.map(g => ({
      id: g._id,
      creatorId: g.creatorId._id,
      participants: g.participants.map(p => ({ userId: p.userId._id, quantity: p.quantity }))
    })));
    
    const filteredGroups = availableGroups.filter(group => {
      const isParticipant = group.participants.some(p => p.userId._id.toString() === userId);
      console.log(`Group ${group._id}: isParticipant = ${isParticipant}`);
      return !isParticipant;
    });
    
    console.log('Filtered groups:', filteredGroups.length);
    console.log('Filtered groups data:', filteredGroups);
    
    res.json(filteredGroups);
  } catch (error) {
    console.error('Error fetching available groups:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/grouporders/:id/join - join a group order
router.post('/:id/join', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, quantity } = req.body;
    
    if (!userId || !quantity) {
      return res.status(400).json({ message: 'User ID and quantity are required' });
    }
    
    const groupOrder = await GroupOrder.findById(id);
    if (!groupOrder) {
      return res.status(404).json({ message: 'Group order not found' });
    }
    
    if (groupOrder.creatorId.toString() === userId) {
      return res.status(400).json({ message: 'Creator cannot join their own group' });
    }
    
    // Check if user is already a participant
    const existingParticipant = groupOrder.participants.find(p => p.userId.toString() === userId);
    if (existingParticipant) {
      return res.status(400).json({ message: 'Already a participant in this group' });
    }
    
    if (groupOrder.participants.length >= groupOrder.maxParticipants) {
      return res.status(400).json({ message: 'Group is full' });
    }
    
    // Calculate total quantity already allocated
    const totalAllocated = groupOrder.participants.reduce((sum, p) => sum + p.quantity, 0);
    const remainingQuantity = groupOrder.totalQuantity - totalAllocated;
    
    if (quantity > remainingQuantity) {
      return res.status(400).json({ 
        message: `Only ${remainingQuantity} units remaining. You cannot request ${quantity} units.` 
      });
    }
    
    groupOrder.participants.push({
      userId: userId,
      quantity: quantity
    });
    await groupOrder.save();
    
    res.json({ message: 'Successfully joined group order', groupOrder });
  } catch (error) {
    console.error('Error joining group order:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/grouporders/:id - cancel a group order (only by creator)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { creatorId } = req.body;
    
    if (!creatorId) {
      return res.status(400).json({ message: 'Creator ID is required' });
    }
    
    const groupOrder = await GroupOrder.findById(id);
    if (!groupOrder) {
      return res.status(404).json({ message: 'Group order not found' });
    }
    
    if (groupOrder.creatorId.toString() !== creatorId) {
      return res.status(403).json({ message: 'Only creator can cancel the group order' });
    }
    
    groupOrder.status = 'cancelled';
    await groupOrder.save();
    
    res.json({ message: 'Group order cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling group order:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/grouporders/:id/place-order - place a group order (make it available to suppliers)
router.post('/:id/place-order', async (req, res) => {
  try {
    const { id } = req.params;
    const { creatorId, orderType } = req.body;
    
    if (!creatorId) {
      return res.status(400).json({ message: 'Creator ID is required' });
    }
    
    const groupOrder = await GroupOrder.findById(id);
    if (!groupOrder) {
      return res.status(404).json({ message: 'Group order not found' });
    }
    
    if (groupOrder.creatorId.toString() !== creatorId) {
      return res.status(403).json({ message: 'Only creator can place the group order' });
    }
    
    // Check if quantity is fulfilled
    const totalAllocated = groupOrder.participants.reduce((sum, p) => sum + p.quantity, 0);
    if (totalAllocated < groupOrder.totalQuantity) {
      return res.status(400).json({ 
        message: `Cannot place order. Only ${totalAllocated}/${groupOrder.totalQuantity} units allocated.` 
      });
    }
    
    // Update status to 'ordered' to make it visible to suppliers
    groupOrder.status = 'ordered';
    groupOrder.orderType = orderType || 'group_order';
    groupOrder.orderedAt = new Date();
    await groupOrder.save();
    
    res.json({ message: 'Group order placed successfully', groupOrder });
  } catch (error) {
    console.error('Error placing group order:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/grouporders/supplier/:supplierId - get group orders for suppliers
router.get('/supplier/:supplierId', async (req, res) => {
  try {
    const { supplierId } = req.params;
    
    // Get group orders that have been placed (status: 'ordered')
    const groupOrders = await GroupOrder.find({ 
      status: 'ordered',
      orderType: 'group_order'
    })
    .populate('creatorId', 'name email')
    .populate('participants.userId', 'name email')
    .sort({ orderedAt: -1 });
    
    res.json(groupOrders);
  } catch (error) {
    console.error('Error fetching supplier group orders:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/grouporders/:id/status - update group order status (for suppliers)
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, supplierId } = req.body;
    
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }
    
    const groupOrder = await GroupOrder.findById(id);
    if (!groupOrder) {
      return res.status(404).json({ message: 'Group order not found' });
    }
    
    // Update status
    groupOrder.status = status;
    if (supplierId) {
      groupOrder.supplierId = supplierId;
    }
    
    // If status is being changed to 'ongoing', mark as accepted
    if (status === 'ongoing' && supplierId) {
      groupOrder.acceptedAt = new Date();
    }
    
    groupOrder.updatedAt = new Date();
    await groupOrder.save();
    
    res.json({ message: 'Group order status updated successfully', groupOrder });
  } catch (error) {
    console.error('Error updating group order status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/grouporders/:id/mark-read - mark order as read by supplier
router.post('/:id/mark-read', async (req, res) => {
  try {
    const { id } = req.params;
    const { supplierId } = req.body;
    
    if (!supplierId) {
      return res.status(400).json({ message: 'Supplier ID is required' });
    }
    
    const groupOrder = await GroupOrder.findById(id);
    if (!groupOrder) {
      return res.status(404).json({ message: 'Group order not found' });
    }
    
    // Check if supplier has already read this order
    const alreadyRead = groupOrder.readBySuppliers.some(read => 
      read.supplierId.toString() === supplierId
    );
    
    if (!alreadyRead) {
      groupOrder.readBySuppliers.push({
        supplierId: supplierId,
        readAt: new Date()
      });
      await groupOrder.save();
    }
    
    res.json({ message: 'Order marked as read successfully' });
  } catch (error) {
    console.error('Error marking order as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/grouporders/accepted/:supplierId - get accepted orders for supplier
router.get('/accepted/:supplierId', async (req, res) => {
  try {
    const { supplierId } = req.params;
    
    // Get orders that have been accepted by this supplier
    const acceptedOrders = await GroupOrder.find({ 
      supplierId: supplierId,
      status: { $in: ['ongoing', 'completed'] }
    })
    .populate('creatorId', 'name email')
    .populate('participants.userId', 'name email')
    .sort({ acceptedAt: -1 });
    
    res.json(acceptedOrders);
  } catch (error) {
    console.error('Error fetching accepted orders:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/grouporders/vendor-overview/:vendorId - get vendor overview data
router.get('/vendor-overview/:vendorId', async (req, res) => {
  try {
    const { vendorId } = req.params;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Active group orders (where vendor is creator and status is active)
    const activeGroupOrders = await GroupOrder.find({
      creatorId: vendorId,
      status: 'active',
      deadline: { $gt: now }
    }).countDocuments();
    
    // Pending orders (where vendor is creator and status is ordered)
    const pendingOrders = await GroupOrder.find({
      creatorId: vendorId,
      status: 'ordered'
    }).countDocuments();
    
    // Recent deliveries (completed orders in last 30 days)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const recentDeliveries = await GroupOrder.find({
      creatorId: vendorId,
      status: 'completed',
      updatedAt: { $gte: thirtyDaysAgo }
    }).countDocuments();
    
    // Money saved calculation (estimated based on group orders)
    const completedOrdersThisMonth = await GroupOrder.find({
      creatorId: vendorId,
      status: 'completed',
      updatedAt: { $gte: startOfMonth }
    });
    
    // Calculate estimated savings (assuming 20% savings on group orders)
    const totalQuantityThisMonth = completedOrdersThisMonth.reduce((sum, order) => sum + order.totalQuantity, 0);
    const estimatedSavings = Math.round(totalQuantityThisMonth * 0.2 * 10); // Assuming $10 per unit savings
    
    // Recent group orders for display
    const recentGroupOrders = await GroupOrder.find({
      creatorId: vendorId,
      status: { $in: ['active', 'ordered', 'ongoing', 'completed'] }
    })
    .populate('participants.userId', 'name email')
    .sort({ createdAt: -1 })
    .limit(5);
    
    res.json({
      activeGroupOrders,
      pendingOrders,
      recentDeliveries,
      estimatedSavings,
      recentGroupOrders
    });
  } catch (error) {
    console.error('Error fetching vendor overview:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/grouporders/all - get all groups (for testing)
router.get('/all', async (req, res) => {
  try {
    console.log('Fetching ALL groups (no filters)');
    const allGroups = await GroupOrder.find({})
      .populate('creatorId', 'name email')
      .populate('participants.userId', 'name email')
      .sort({ createdAt: -1 });
    
    console.log('Total groups in database:', allGroups.length);
    console.log('Groups:', allGroups.map(g => ({
      id: g._id,
      items: g.items,
      creatorId: g.creatorId?.name,
      status: g.status,
      deadline: g.deadline,
      participants: g.participants.length
    })));
    
    res.json(allGroups);
  } catch (error) {
    console.error('Error fetching all groups:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Supplier overview analytics endpoint
router.get('/supplier-overview/:supplierId', async (req, res) => {
  try {
    const { supplierId } = req.params;
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Total orders this week/month
    const totalOrders = await GroupOrder.countDocuments({ supplierId });
    const totalOrdersThisWeek = await GroupOrder.countDocuments({ supplierId, createdAt: { $gte: startOfWeek } });
    const totalOrdersThisMonth = await GroupOrder.countDocuments({ supplierId, createdAt: { $gte: startOfMonth } });

    // Pending deliveries (ordered or ongoing)
    const pendingDeliveries = await GroupOrder.countDocuments({ supplierId, status: { $in: ['ordered', 'ongoing'] } });

    // Revenue earned (sum of completed order quantities * 10 as dummy price)
    const completedOrders = await GroupOrder.find({ supplierId, status: 'completed' });
    const revenueEarned = completedOrders.reduce((sum, order) => sum + (order.totalQuantity || 0) * 10, 0);

    // Top-rated product (by average review)
    // For now, just return the most frequent item in completed orders as a placeholder
    const itemCounts = {};
    completedOrders.forEach(order => {
      if (order.items) itemCounts[order.items] = (itemCounts[order.items] || 0) + 1;
    });
    let topRatedProduct = null;
    let maxCount = 0;
    Object.entries(itemCounts).forEach(([item, count]) => {
      if (count > maxCount) {
        topRatedProduct = item;
        maxCount = count;
      }
    });

    res.json({
      totalOrders,
      totalOrdersThisWeek,
      totalOrdersThisMonth,
      pendingDeliveries,
      revenueEarned,
      topRatedProduct
    });
  } catch (error) {
    console.error('Error fetching supplier overview:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
