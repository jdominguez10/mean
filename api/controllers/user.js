'use strict'
var bcrypt = require('bcrypt-nodejs');

var mongoosepaginate = require('mongoose-pagination');

var User = require('../models/user');
//agregar servicios
var jwt = require('../services/jwt');

//Permite trabajar con archivos
var fs = require('fs');
var path = require('path');


function home(req, res){
    res.status(200).send({
        message: 'Hola mundo desde el servidor NodoJS'
    });
}


function pruebas(req, res){
        res.status(200).send({
            message: 'Acción de pruebas en el servidor de NodeJS'
        });
}
/**
 * Guardar Usuario
 * @param {*} req 
 * @param {*} res 
 */
function saveUser(req, res){
   
        var params = req.body;
        var user = new User();
        
       
        if(params.name && params.surname && params.nick && params.email && params.password){
            
            user.name = params.name;
            user.surname = params.surname;
            user.nick = params.nick;
            user.email = params.email;
            user.role = 'ROLE_USER';
            user.image = null;

            //Controlar los Usuarios duplicados
            User.find({ $or: [
                    {email: user.email.toLowerCase()},
                    {nick: user.nick.toLowerCase()}
            ]}).exec((err, users) => { 
                if(err) return res.status(500).send({message: 'Error en la petición de usuarios'});
                if(users && users.length >= 1){
                    return res.status(200).send({message: 'El usuario ya esta registrado'});
                }else{

                    //Cifra los datos
                    bcrypt.hash(params.password, null, null, (err,hash) => {
                        user.password = hash;
                        user.save((err, userStored) => {
                            if(err) return res.status(500).send({menssage : 'Error al guardar el usuario'})
                            if(userStored){
                                res.status(200).send({user: userStored})
                            }else{
                                res.status(400).send({menssage : 'No se ha registrado el usuario'})
                            }
                        });

                    });


                }

            });


            
        }else{
            res.status(200).send({
                message: 'Envia todos los campos enecesarios!!'
            });

        }
}
/**
 * Logear Usuario
 * @param {*} req 
 * @param {*} res 
 */
function loginUser(req,res){
    var params = req.body;

    var email = params.email;
    var password = params.password;


    User.findOne({email : email}, (err, user) => {
            if(err){
                return res.status(500).send({message: 'Error en la petición'});
            }
            if(user){
                bcrypt.compare(password, user.password, (err, check) =>{
                    if(check){
                        if(params.gettoken){
                                //generar y devolver el token
                                //gemerar token
                                return res.status(200).send({token: jwt.createToken(user)});
                        }else{
                            //devolver datos de usuario
                             user.password = undefined;
                             return res.status(200).send({ message:'Login realizado correctamente', user});

                        } 

                    }else{
                        return res.status(404).send({message: 'El usuario no se ha podido identificar 1'})
                    }
                });
            }else{
                return res.status(404).send({message:'El usuario no se ha podido identificar 2'});

            }
    });


}
/**
 * Conseguir datos de usuario
 */
function getUser(req,res){
    var UserId = req.params.id;

    User.findById(UserId, (err, user) => {
        if (err) return res.status(500).send({message:'Error en la petición'});
        if (!user) return res.status(404).send({message:'El usuario no existe'});

        return res.status(200).send({user});
    });

}

/**
 * Paginación, obtiene el número de página
 * @param {*} req 
 * @param {*} res
 */
function getUsers(req, res){
    var identity_user_id = req.user.sub;
    
    var page = 1;
    if(req.params.page){
            page = req.params.page;
    }

    var itemsPerPage = 5;

  

    User.find().sort('_id').paginate(page, itemsPerPage, (err, users, total) => {
        if (err) return res.status(500).send({message:'Error en la petición'});
        if (!users) return res.status(404).send({message:'No hay usuarios disponibles'});


        var pages =  Math.ceil(total/itemsPerPage);

          
         return res.status(200).send({
            users,
            total,
            pages

        });

    }); 

}
/**
 * Edición de datos de usuario
 */
function updateUser(req, res){
    var userId = req.params.id;

    // se le pasa a mongoose para actualizar los datos
    var update = req.body;


    //borrar propiedad password
    delete update.password;


    if(userId != req.user.sub){
        return  res.status(500).send({message:'No tienes permiso para actualizar los datos del usuario'});
    }

    User.findByIdAndUpdate(userId, update, {new:true}, (err,userUpdated) => {
        if(err) return res.status(500).send({message:'Error en la petición'}) ;
        
        if(!userUpdated) return res.status(404).send({message:'No se ha podido actualizar el usuario'});

        return res.status(200).send({user:userUpdated});

    });

}

/**
 * Subir archivos de imagen/avatar usuario
 */

function uploadImage(req, res){
    console.log("ENTRA");
    try{
var userId = req.params.id; 

    if(userId != req.user.sub){
        return  res.status(500).send({message:'No tienes permiso para actualizar los datos del usuario'});
    }

    if(req.files){
        try{
            var file_path = req.files.image.path;
        //console.log(file_path);
        var file_split = file_path.split('\/');
        //console.log(file_split);

        var file_name = file_split[2];
     ///   console.log(file_name);

        var ext_split = file_name.split('\.');
   //     console.log(ext_split);

        var file_ext = ext_split[1];
       // console.log(file_ext);
        
            if(file_ext === 'png' || file_ext ==='jpg' || file_ext === 'jpeg' || file_ext === 'gif'){
                //Actualizar documento de usuario logueado
                User.findByIdAndUpdate(userId, {image:file_name}, {new:true}, (err, userUpdated)=>{
                     if(err) return res.status(500).send({message:'Error en la petición'}) ;
                     if(!userUpdated) return res.status(404).send({message:'No se ha podido actualizar el usuario'});
                        return res.status(200).send({user:userUpdated});


                });
              
            }else{
              
                return removeFileOfUploads(res, file_path, 'Extension no valida');
 
            }
    
    
    
        }catch(err){
            console.log(err);
            return res.status(404).send({message:err});
        }
        
    }else{
        return res.status(200).send({message:'No se han subido archivos'});

    }
    }catch(err){
  console.log(err);
  return res.status(404).send({message:err});
    }

    
}
//funcion auxiliar
function removeFileOfUploads(res, file_path, message){
    fs.unlink(file_path, (err) => {
         return res.status(200).send({message:message});

    });
                
}

function getImageFile(req, res){

      
    var imageFile = req.params.imageFile;
    var path_file = './uploads/users/' + imageFile;

console.log(path_file);
   fs.exists(path_file, (exists) =>{
        if(exists){
            res.sendFile(path.resolve(path_file));
        }else{
            res.status(200).send({message:'No existe la imagen...'});
        }

    }); 
}

module.exports = {
	home, 
    pruebas,
    saveUser,
    loginUser,
    getUser,
    getUsers,
    updateUser,
    uploadImage,
    getImageFile
}

