// const mongoose = require("mongoose");

// const adminSchema = new mongoose.Schema(
//   {
//     superAdminId: {
//       type: mongoose.Schema.Types.ObjectId,
//       required: true,
//       ref: "SuperAdminModel",
//     },
//     superAdminPhoto: {
//       type: String,
//       default: "",
//     },

//     name: {
//       type: String,
//       required: [true, "Name is required"],
//       trim: true,
//     },
//     email: {
//       type: String,
//       required: [true, "Email is required"],
//       unique: true,
//       trim: true,
//       lowercase: true,
//       match: [/^\S+@\S+\.\S+$/, "Invalid email address"],
//     },
//     password: {
//       type: String,
//       required: [true, "Password is required"],
//       minlength: [8, "Password must be at least 8 characters"],
//     },
//     role: {
//       type: String,
//       enum: ["admin", "manager"],
//       default: "manager",
//     },
//     status: {
//       type: String,
//       enum: ["active", "inactive"],
//       default: "active",
//     },
//     permissions: {
//       type: [String],
//       default: [],
//     },
//   },
//   {
//     timestamps: true,
//   }
// );

// const AdminModel = mongoose.model("AdminModel", adminSchema);

// module.exports = AdminModel;








// *********tracking last login of admin ******



const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      default: "admin",
    },
    status: {
      type: String,
      default: "active",
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    superAdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SuperAdmin",
    },

    superAdminPhoto: {
      type: String,
      default: "",
    },

    permissions: {
      type: Array,
      default: [],
    },
  },
  { timestamps: true }
);

const AdminModel = mongoose.model("AdminModel", adminSchema);

module.exports = AdminModel;
