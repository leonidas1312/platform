// 20230401_rename_passwrdo_column.js
exports.up = function (knex) {
    return knex.schema.alterTable("email_verifications", (table) => {
      // rename 'passwrdo' to 'password'
      table.renameColumn("passowrd", "password");
    });
  };
  
  exports.down = function (knex) {
    return knex.schema.alterTable("email_verifications", (table) => {
      // revert the rename if needed
      table.renameColumn("password", "passowrd");
    });
  };
  