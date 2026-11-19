-- Company mail is unique once it is set. Empty addresses stay empty.
CREATE UNIQUE INDEX "Staff_company_email_key" ON "Staff" ("email") WHERE "email" <> '';
