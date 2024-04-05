--liquibase formatted sql

--changeset tphipson:create-Route-table
CREATE TABLE "Route" (
  "routeId" [int] IDENTITY(1,1) NOT NULL,
  "lineNumber" [int] NOT NULL,
  "filePath" varchar(255)
);
--rollback DROP TABLE "Route";

--changeset tphipson:add-route-pk
ALTER TABLE "Route"
ADD CONSTRAINT [PK_Route] PRIMARY KEY CLUSTERED ("routeId" ASC);
--rollback ALTER TABLE "Route" DROP CONSTRAINT PK_Route;