const ServiceRequestModel = require('../models/newModel/serviceRequestModel');


// Create a new service request
exports.createServiceRequest = async (req, res) => {
  try {
    const { clientId, clientName, phoneNumber, serviceId, serviceName, message } = req.body;

    // Include superAdminId only if available (e.g., for authenticated admin users)
    const superAdminId = req.user ? req.user._id : null;

    if (!clientName || !phoneNumber || !serviceName || !message) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    const newRequest = new ServiceRequestModel({
      superAdminId, // Optional field
      clientId,
      clientName,
      phoneNumber,
      serviceId,
      serviceName,
      message,
    });

    await newRequest.save();
    res.status(201).json({ message: 'Service request created successfully.', data: newRequest });
  } catch (error) {
    console.error('Error creating service request:', error);
    res.status(500).json({ error: 'Failed to create service request.' });
  }
};






//Get all service requests Controller
exports.getAllServiceRequests = async (req, res) => {
  try {
    const requests = await ServiceRequestModel.find().sort({ createdAt: -1 });
    res.status(200).json({ data: requests });
  } catch (error) {
    console.error('Error fetching service requests:', error);
    res.status(500).json({ error: 'Failed to fetch service requests.' });
  }
};


// Get a single service request by ID
exports.getServiceRequestById = async (req, res) => {
  try {
    const { _id: superAdminId } = req.user; 
    const { id } = req.params;

    const request = await ServiceRequestModel.findOne({ _id: id, superAdminId }); // Verify superAdminId ownership

    if (!request) {
      return res.status(404).json({ error: 'Service request not found or you do not have access to it.' });
    }

    res.status(200).json({ data: request });
  } catch (error) {
    console.error('Error fetching service request:', error);
    res.status(500).json({ error: 'Failed to fetch service request.' });
  }
};



// Update a service request status Controller
exports.updateServiceRequestStatus = async (req, res) => {
  try {
    const { _id: superAdminId } = req.user; 
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value.' });
    }

    const updatedRequest = await ServiceRequestModel.findOneAndUpdate(
      { _id: id, superAdminId }, // Verify superAdminId ownership
      { status },
      { new: true }
    );

    if (!updatedRequest) {
      return res.status(404).json({ error: 'Service request not found or you do not have access to it.' });
    }

    res.status(200).json({ message: 'Service request updated successfully.', data: updatedRequest });
  } catch (error) {
    console.error('Error updating service request:', error);
    res.status(500).json({ error: 'Failed to update service request.' });
  }
};

// Delete a service request
exports.deleteServiceRequest = async (req, res) => {
  try {
    const { _id: superAdminId } = req.user; 
    const { id } = req.params;

    const deletedRequest = await ServiceRequestModel.findOneAndDelete({ _id: id, superAdminId }); // Verify superAdminId ownership

    if (!deletedRequest) {
      return res.status(404).json({ error: 'Service request not found or you do not have access to it.' });
    }

    res.status(200).json({ message: 'Service request deleted successfully.' });
  } catch (error) {
    console.error('Error deleting service request:', error);
    res.status(500).json({ error: 'Failed to delete service request.' });
  }
};
