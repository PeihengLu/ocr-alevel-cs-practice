CREATE TABLE students (
  id INT PRIMARY KEY,
  name VARCHAR(64) NOT NULL,
  year_group INT NOT NULL
);

INSERT INTO students (id, name, year_group) VALUES
  (1, 'Amina', 12),
  (2, 'Ben', 13),
  (3, 'Cara', 12),
  (4, 'Dev', 12);
