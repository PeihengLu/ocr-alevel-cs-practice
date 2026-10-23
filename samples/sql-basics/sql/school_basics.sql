-- Tiny school roster for absolute beginners (no JOINs).
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
