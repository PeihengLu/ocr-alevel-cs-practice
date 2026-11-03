-- School dataset for the SQL exercises.
CREATE TABLE students (
  id INT PRIMARY KEY,
  name VARCHAR(64) NOT NULL,
  year_group INT NOT NULL,
  house VARCHAR(32) NOT NULL,
  maths_score INT NOT NULL
);

INSERT INTO students (id, name, year_group, house, maths_score) VALUES
  (1, 'Amina', 12, 'Red', 78),
  (2, 'Ben', 13, 'Blue', 64),
  (3, 'Cara', 12, 'Green', 91),
  (4, 'Dev', 12, 'Red', 55),
  (5, 'Elena', 13, 'Blue', 88),
  (6, 'Farah', 11, 'Green', 72);

CREATE TABLE houses (
  name VARCHAR(32) PRIMARY KEY,
  head VARCHAR(64) NOT NULL,
  colour VARCHAR(32) NOT NULL
);

INSERT INTO houses (name, head, colour) VALUES
  ('Red', 'Ms Khan', 'Crimson'),
  ('Blue', 'Mr Adeyemi', 'Navy'),
  ('Green', 'Dr Okonkwo', 'Emerald'),
  ('Yellow', 'Ms Patel', 'Gold');
