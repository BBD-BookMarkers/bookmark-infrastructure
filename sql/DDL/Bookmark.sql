--liquibase formatted sql

--changeset tphipson:create-Bookmark-table
CREATE TABLE "Bookmark" (
  "bookmarkId" [int] IDENTITY(1,1) NOT NULL,
  "userId" [int] NOT NULL,
  "routeId" [int] NOT NULL,
  "name" varchar(255) NOT NULL,
  "createdDate" datetime NOT NULL,
);
--rollback DROP TABLE Bookmark;

--changeset tphipson:add-bookmark-pk
ALTER TABLE "Bookmark"
ADD CONSTRAINT [PK_Bookmark] PRIMARY KEY CLUSTERED ("bookmarkId" ASC);
--rollback ALTER TABLE "Bookmark" DROP CONSTRAINT PK_Bookmark;

--changeset tphipson:add-bookmark-fk-user
ALTER TABLE "Bookmark"
ADD CONSTRAINT [FK_UserId] FOREIGN KEY ("userId") REFERENCES "User" ("userId");
--rollback ALTER TABLE "Bookmark" DROP CONSTRAINT FK_UserId;

--changeset tphipson:add-bookmark-fk-route
ALTER TABLE "Bookmark"
ADD CONSTRAINT [FK_routeId] FOREIGN KEY ("routeId") REFERENCES "Route" ("routeId");
--rollback ALTER TABLE "Bookmark" DROP CONSTRAINT FK_RouteId;