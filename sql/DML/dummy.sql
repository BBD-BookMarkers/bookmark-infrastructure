--liquibase formatted sql

--changeset tphipson:insert-User-dummy1
INSERT INTO "User" (username) VALUES ('dummyUser1');
--rollback DELETE FROM "User" WHERE username = 'dummyUser1';