Select * from Producto Where idCategoria IS null;
Update Producto Set Utilidad = 0 Where Utilidad is NULL;

Update Producto Set Precio1 = 0 Where Precio1 is NULL;
Update Producto Set Precio2 = 0 Where Precio2 is NULL;
Update Producto Set Precio3 = 0 Where Precio3 is NULL;
Update Producto Set Precio4 = 0 Where Precio4 is NULL;
Update Producto Set Precio5 = 0 Where Precio5 is NULL;
Update Producto Set Precio6 = 0 Where Precio6 is NULL;
Update Producto Set Precio7 = 0 Where Precio7 is NULL;
Update Producto Set Precio8 = 0 Where Precio8 is NULL;
Update Producto Set Precio9 = 0 Where Precio9 is NULL;

Update Producto Set Enviado = 0 Where Enviado is NULL;
Update Producto Set Sincroniza = 0 Where Sincroniza is NULL;

Update Producto Set EsProvedorExterno = 0 Where EsProvedorExterno is NULL;
Update Producto Set Revisado = 0 Where Revisado is NULL;

Update Producto Set Existencia = 0 Where Existencia is NULL;

Update Producto Set idEmpresa = 1 Where idEmpresa is NULL;

Select * from 