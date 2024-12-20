
const JWT = require('jsonwebtoken');
const authModel = require('../../models/newModel/authModel');
const SuperAdminModel = require('../../models/newModel/superAdminModel');


// exports.requireLogin = async (req, res, next) => {
//   const token = req.header('Authorization');

//   if (!token) {
//     return res.status(401).json({ success: false, message: 'Unauthorized: Login First' });
//   }

//   try {
//     // Remove "Bearer" and trim whitespace
//     const decoded = JWT.verify(token.replace("Bearer ", "").trim(), process.env.SECRET_KEY);

//     req.user = decoded; 
//     next(); 
//   } catch (error) {
//     console.error('Token Verification Error:', error.message);
//     return res.status(401).json({ success: false, message: 'Unauthorized: Invalid Token' });
//   }
// };



exports.requireLogin = async (req, res, next) => {
  const token = req.header('Authorization');

  console.log('Authorization Header:', token);  // Log the token here

  if (!token) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Login First' });
  }

  try {
    // Remove "Bearer " and trim whitespace
    const decoded = JWT.verify(token.replace("Bearer ", "").trim(), process.env.SECRET_KEY);
    req.user = decoded; // Attach the decoded user data to req.user
    console.log('Decoded Token:', decoded);  // Log the decoded token
    next();  // Proceed to the next middleware or route handler
  } catch (error) {
    console.error('Token Verification Error:', error.message);
    return res.status(401).json({ success: false, message: 'Unauthorized: Invalid Token' });
  }
};




// exports.isAdmin = async (req, res, next) => {
//   try {
//       const user = await authModel.findById(req.user._id); 
//       if (!user || user.role !== 'admin') {
//           return res.status(401).json({ success: false, message: 'Unauthorized' });
//       }
//       next(); 
//   } catch (error) {
//       console.error('Error in isAdmin middleware:', error);
//       res.status(401).json({ success: false, message: 'Unauthorized' });
//   }
// };




// exports.isAdmin = async (req, res, next) => {
//   try {
//     // Ensure that `req.user` exists
//     if (!req.user || !req.user._id) {
//       return res.status(401).json({ success: false, message: 'Unauthorized: Invalid User Data' });
//     }

//     // Fetch the user's role
//     const user = await authModel || SuperAdminModel.findById(req.user._id).select('role'); // Fetch only the role field
//     if (!user || !['admin', 'superadmin'].includes(user.role)) {
//       return res.status(403).json({ success: false, message: 'Access Denied: Insufficient Permissions' });
//     }

//     next(); // User is either `admin` or `superadmin`, proceed to the next step
//   } catch (error) {
//     console.error('Error in isAdmin middleware:', error.message);
//     res.status(500).json({ success: false, message: 'Internal Server Error' });
//   }
// };






exports.isAdmin = async (req, res, next) => {
  try {
    // Ensure that `req.user` exists
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: 'Unauthorized: Invalid User Data' });
    }

    const userId = req.user._id;

    // Check user role in both models
    const authUser = await authModel.findById(userId).select('role');
    const superAdminUser = !authUser ? await SuperAdminModel.findById(userId).select('role') : null;

    // Determine role from whichever model returned a user
    const role = authUser?.role || superAdminUser?.role;

    // Check if the role is `admin` or `superadmin`
    if (!role || !['admin', 'superadmin'].includes(role)) {
      return res.status(403).json({ success: false, message: 'Access Denied: Insufficient Permissions' });
    }

    next(); // User is either `admin` or `superadmin`, proceed to the next step
  } catch (error) {
    console.error('Error in isAdmin middleware:', error.message);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

