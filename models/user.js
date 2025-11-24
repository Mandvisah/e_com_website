const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  firstName: {
    type: String,
    default: ''
  },
  lastName: {
    type: String,
    default: ''
  },
  email:{
    type: String,
    required: true,
    unique: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  street: {
    type: String,
    default: ''
  },
  apartment: {
    type: String,
    default: ''
  },
  city: {
    type: String,
    default: ''
  },
  zip: {
    type: String,
    default: ''
  },
  country: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    required: true
  },
  dateOfBirth: {
    type: Date,
    default: null
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationOTP: {
    type: String,
    default: null
  },
  otpExpires: {
    type: Date,
    default: null
  },
  passwordResetToken: {
    type: String,
    default: null
  },
  passwordResetExpires: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

userSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

userSchema.set('toJSON', {
  virtuals: true,
});


exports.User = mongoose.model('User', userSchema);