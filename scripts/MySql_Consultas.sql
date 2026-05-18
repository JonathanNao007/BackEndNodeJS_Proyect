USE proyectonodejs;

ALTER TABLE Productos 
RENAME COLUMN `elsesProvedorExterno` TO `esProvedorExterno`;

ALTER TABLE Productos 
MODIFY COLUMN observaciones varchar(600);

ALTER TABLE Productos 
MODIFY COLUMN descripcion varchar(600);

ALTER TABLE Productos MODIFY COLUMN indicacion1 varchar(600);
ALTER TABLE Productos MODIFY COLUMN indicacion2 varchar(600);
ALTER TABLE Productos MODIFY COLUMN indicacion3 varchar(600);
ALTER TABLE Productos MODIFY COLUMN indicacion4 varchar(600);
ALTER TABLE Productos MODIFY COLUMN indicacion5 varchar(600);
ALTER TABLE Productos MODIFY COLUMN indicacion6 varchar(600);
ALTER TABLE Productos MODIFY COLUMN indicacion7 varchar(600);
ALTER TABLE Productos MODIFY COLUMN indicacion8 varchar(600);
ALTER TABLE Productos MODIFY COLUMN indicacion9 varchar(600);
ALTER TABLE Productos MODIFY COLUMN indicacion10 varchar(600);

ALTER TABLE Productos MODIFY COLUMN ingredienteActivo varchar(500);

Select * from Productos;
Select * from Lotes;
Select * from ExistenciaSucursals;



