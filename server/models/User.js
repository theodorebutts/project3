// DEPENDENCIES
const { Schema, model } = require("mongoose");
const bcrypt = require("bcrypt");
const recipeSchema = require("./Recipe"); // import schema from Recipe.js
// DEFINE User Schema
const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      match: [/.+@.+\..+/, "Must use a valid email address"],
    },
    password: {
      type: String,
      required: true,
    },
    // set savedRecipes to be an array of data that adheres to the recipeSchema
    savedRecipes: [recipeSchema],
  },
  // set this to use virtual below
  {
    toJSON: {
      virtuals: true,
    },
  }
);
// HASH user password
userSchema.pre("save", async function (next) {
  if (this.isNew || this.isModified("password")) {
    const saltRounds = 10;
    this.password = await bcrypt.hash(this.password, saltRounds);
  }
  next();
});
// custom method to compare and validate password for logging in
userSchema.methods.isCorrectPassword = async function (password) {
  return bcrypt.compare(password, this.password);
};
// when we query a user, we'll also get another field called `recipeCount` with the number of saved recipes we have
userSchema.virtual("recipeCount").get(function () {
  return this.savedRecipes.length;
});
// DEFINE User
const User = model("User", userSchema);
// EXPORTS
module.exports = User;
