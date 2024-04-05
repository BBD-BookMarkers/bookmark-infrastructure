--liquibase formatted sql

--changeset tphipson:create-User-table
CREATE TABLE "User" (
  "userId" [int] IDENTITY(1,1) NOT NULL,
  "username" varchar(255) NOT NULL,
);
--rollback DROP TABLE "User";

ALTER TABLE "User"
ADD CONSTRAINT [PK_User] PRIMARY KEY CLUSTERED ("userId" ASC);