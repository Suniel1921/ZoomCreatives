const mongoose = require('mongoose');

// const clientSchema = new mongoose.Schema({
//     name: {
//         type: String,
//         required: true
//         },
//     category: {
//         type: String,
//         required: true
//     },   
//     status: {type: String, enum: ['active', 'inactive'], default: 'active' }, 

//     email: {type: String,
//         required: true,
//         unique: true,
//      },
//      password: {
//         type: String,
//         required: true,
//     },
//     phone: {type: String,
//         required: false,
//     },
   
//     nationality: {
//         type: String,
//         // required: true,
//      },
//      postalCode : {
//         type: Number,
//         required: false,
//     },
//     prefecture:{
//         type: String,
//         required: false,
//     },
//     city: {
//         type: String,
//         required: false,
//     },
//     street: {
//         type: String,
//         required: false,
//     },
//     building:{
//         type: String,
//         required: false,
//     },
//     contactPreferences: {
//         type: [String],
//         enum: ['Direct Call', 'Viber', 'WhatsApp', 'Facebook Messager'],
//       },      
//     facebookProfileURL:{
//         type: String,
//         required: false,
//     },  
   
//     profilePhoto: {
//         type: String,
//     },
//   },
//   { timestamps: true }
// );

// const ClientModel = mongoose.model('ClientModel', clientSchema);

// module.exports = ClientModel;










const clientSchema = new mongoose.Schema({
    name: { type: String, required: true },
    category: { type: String, required: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String },
    nationality: { type: String },
    postalCode: { type: String },
    prefecture: { type: String },
    city: { type: String },
    street: { type: String },
    building: { type: String },
    modeOfContact: { type: [String] },
    socialMedia: { type: Object },
    timeline: { type: Array },
    dateJoined: { type: Date },
    profilePhoto: { type: String },
  }, { timestamps: true });
  


const ClientModel = mongoose.model('ClientModel', clientSchema);

module.exports = ClientModel;