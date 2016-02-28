// Part of <https://miracle.systems/p/walkner-utilio> licensed under <CC BY-NC-SA 4.0>

'use strict';

module.exports = function setupUserModel(app, mongoose)
{
  var userMobileSchema = mongoose.Schema({
    fromTime: {
      type: String,
      required: true,
      pattern: /^[0-9]{2}:[0-9]{2}$/
    },
    toTime: {
      type: String,
      required: true,
      pattern: /^[0-9]{2}:[0-9]{2}$/
    },
    number: {
      type: String,
      required: true
    }
  }, {
    _id: false
  });

  var userSchema = mongoose.Schema({
    login: {
      type: String,
      trim: true,
      required: true
    },
    password: {
      type: String,
      trim: true,
      required: true
    },
    email: String,
    mobile: [userMobileSchema],
    privileges: [String],
    personnelId: String,
    firstName: String,
    lastName: String,
    gender: {
      type: String,
      enum: ['female', 'male'],
      default: 'male'
    }
  }, {
    id: false,
    toJSON: {
      transform: function(alarm, ret)
      {
        delete ret.password;

        return ret;
      }
    }
  });

  userSchema.index({login: 1});
  userSchema.index({personnelId: 1});
  userSchema.index({lastName: 1});
  userSchema.index({privileges: 1});

  userSchema.statics.TOPIC_PREFIX = 'users';

  userSchema.statics.customizeLeanObject = function(leanModel)
  {
    delete leanModel.password;

    return leanModel;
  };

  mongoose.model('User', userSchema);
};
