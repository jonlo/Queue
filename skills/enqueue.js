module.exports = function (controller) {
     
    // Show the api of @queue
    controller.hears(

      ['ayuda','ayuda (.*)','help', 'help (.*)', '(.*) help (.*)'], 

      'direct_message,direct_mention,mention', 

      help

    );
   
   // ver todas las colas
    controller.hears(
      
      ['listar recursos','ver recursos','enseñame los recursos','listar colas','ver colas','enseñame las colas'],
      'direct_message,direct_mention,mention', 
      
      listQueues
      
    );
  
   controller.hears(
      
      ['hello','hi','hola','hola (.*)','(.*) hola (.*)','hello (.*)','(.*) hello (.*)','hi (.*)','(.*) hi (.*)'], 
      
      'direct_message,direct_mention,mention', 
      
      hi

    );

     controller.hears(
      
      ['como molas'], 
      
      'direct_message,direct_mention,mention', 
      
      thx

    );
    // Show users in the queue
    controller.hears(
      
      ['ver (.*)','turno (.*)'], 
      
      'direct_message,direct_mention,mention', 
      
      queue

    );

    // Add user to the queue
    controller.hears(
      
      ['pido (.*)','pillo (.*)','reservo (.*)','reservar (.*)','solicito (.*)','pillar (.*)','pedir (.*)','secuestro (.*)','cojo (.*)'],
      
      'direct_message,direct_mention,mention', 
      
      add

    );

    // Delete user in the queue
    controller.hears(
      
      ['liberar (.*)','libero (.*)','dejo (.*)','dejar (.*)','libre (.*)','suelto (.*)'],
      
      'direct_message,direct_mention,mention', 
      
      del
      
    );

  // Delete all users in the queue
    controller.hears(
      
      ['limpiar oficina'],
      
      'direct_message,direct_mention,mention', 
      
      cleanOffice
      
    );
  
    // Delete all users in the queue
    controller.hears(
      
      ['limpiar (.*)','borrar (.*)'],
      
      'direct_message,direct_mention,mention', 
      
      clean
      
    );

  function cleanOffice(bot, message) {
      const sayHi = 'Lo siento '+ '<@'+ message.user +'> pero mi capacidad de proceso es limitada, no fui construida para realizar tareas faraónicas'
       bot.reply(message, sayHi);
   }
  
  function hi(bot, message) {
      const sayHi = 'Hola '+ '<@'+ message.user +'>quieres reservar algo?:wink:'
       bot.reply(message, sayHi);
   }
  
    function thx(bot, message) {
      const sayHi = 'Gracias! '+ '<@'+ message.user +'>tu tampoco estás mal :wink:'
       bot.reply(message, sayHi);
   }
    /** Callbacks for hears */    

    function help(bot, message) {
       
      const help = 'Que no cunda el pánico '+ '<@'+ message.user +'>! Soy @Queue y puedes pedirme lo siguiente: ' +'\n' + 
            '> `pido recurso`  : Añadirte a la cola de un recurso\n' +
            '> `ver recurso` : Mostrar la cola de un recurso\n' +
            '> `listar recursos` : Mostrar todas las colas de los recursos en uso \n' +
            '> `liberar recurso`  : Borrar usuario de la cola de un recurso\n' + 
            '> `limpiar recurso`: Borrar todos los usuarios de la cola de un recurso\n' +
            '> `ayuda` : Ver comandos disponibles\n' + 
            '> Una cosilla: los recursos tienen que ser nombres únicos aunque me dan igual las mayúsculas.\n' + 
            '> Nómbrame junto con uno de mis comandos. Por ejemplo: Ey `@queue` `pido parzi`. ¡Pruébalo!'; 

       bot.reply(message, help);

    }

    function queue(bot, message) {
      var messageText = message.text;
      var hears = message.text.split(" ")[0];
      var re = new RegExp(hears + ' ([^\\s]+)');
      var queueId = messageText.match(re)[1].toLowerCase();
        // load user from storage...
        controller.storage.teams.get(queueId, function(err, queue) { 
            
            if (!queue || !queue.users || queue.users.length == 0) {
                bot.reply(message, "Parece que el recurso está libre! nómbrame con el comando `pido x` para reservarlo.");                
            } else {
                bot.reply(message, generateQueueList(queue));
            }

        });

    }

    function add(bot, message) {

      console.log(message.text);
      var messageText = message.text;
      var hears = message.text.split(" ")[0];
      var re = new RegExp(hears + ' ([^\\s]+)');
      var queueId = messageText.match(re)[1].toLowerCase();
      controller.storage.teams.get(queueId, function(err, queue) {
            if(err){
            //    return throwError(err);
            }

            if (!queue || !queue.users) {
                queue = {
                    'id': queueId,
                    'users': []
                };                
            }
            
            var user = findUser(queue.users,message.user);
                                     
            if(user){                
                bot.reply(message, "<"+ user.name +">, Ya estas en la cola del recurso `"+queueId+"`, te avisaré cuando sea tu turno.");
                //bot.reply(message, generateQueueList(queue));
            } else {
                
                userInfo(bot.api, message.user, function (err, user) {
                    
                    queue.users.push({
                        id: message.user,
                        name: '@' + user.name
                    });

                    controller.storage.teams.save(queue, function(err,saved) {
                        if (err) {
                            bot.reply(message, 'I experienced an error adding your task: ' + err);
                        } else {
                            
                            bot.api.reactions.add({
                                name: 'thumbsup',
                                channel: message.channel,
                                timestamp: message.ts
                            });

                            bot.reply(message, generateQueueList(queue));
                        }
                    });
                });
            }            
        });
    }
  
    function del(bot, message) {
      var messageText = message.text;
      var hears = message.text.split(" ")[0];
      var re = new RegExp(hears + ' ([^\\s]+)');
      var queueId = messageText.match(re)[1].toLowerCase();
        controller.storage.teams.get(queueId, function(err, queue) {
            if(err){
                //return throwError(err);
            }
            
            if (!queue || !queue.users || queue.users.length == 0 || findUser(queue.users,message.user) === undefined) {
                bot.reply(message, "La cola parra el recurso `"+queueId+"` no existe o no estás en ella");                
            } else {
                                     
                queue.users = queue.users.filter(function(user){
                    return (user.id != message.user);
                });
                     
                controller.storage.teams.save(queue, function(err,saved) {
                    if (err) {
                        bot.reply(message, 'I experienced an error adding your task: ' + err);
                    } else {
                        bot.api.reactions.add({
                            name: 'thumbsup',
                            channel: message.channel,
                            timestamp: message.ts
                        });

                        if(queue.users && queue.users.length > 0){

                            bot.reply(message, '<'+ queue.users[0].name +'> Es tu turno en : `'+queue.id+'`! Cuando termines eliminate de la cola. Nombrame con el comando `liberar x`. Gracias.');
                        }
                    }
                });                
            }                        
        });

    }

    function clean(bot, message) {
      var messageText = message.text;
      var hears = message.text.split(" ")[0];
      var re = new RegExp(hears + ' ([^\\s]+)');
      var queueId = messageText.match(re)[1].toLowerCase();
        controller.storage.teams.get(queueId, function(err, queue) {
            if(err){
              //  return throwError(err);
            }
            
            if (!queue || !queue.users || queue.users.length == 0) {
                bot.reply(message, "El recurso está libre `"+queueId+"`");                
            } else {                
              
                queue.users = [];                                          
                controller.storage.teams.save(queue, function(err,saved) {
                    if (err) {
                        bot.reply(message, 'I experienced an error adding your task: ' + err);
                    } else {
                        bot.api.reactions.add({
                            name: 'thumbsup',
                            channel: message.channel,
                            timestamp: message.ts
                        });
                    }
                });                
            }                        
        });

    }
    
  function listQueues(bot, message) {
     console.log("listQueues");
        controller.storage.teams.all(function(err, all_team_data) {
         var queueIds ="Los siguientes recursos están reservados: \n";
          var showQueues = false;
           all_team_data.forEach(function(team, i){            
             if(team.id) {
               if(team.users){
                 if(team.users.length>0){
                   showQueues = true;
                    queueIds += ">`"+team.id +"` \n"
                 }
               }
             }
              
        });
          if(showQueues){
            bot.reply(message, queueIds);
          }else{
            bot.reply(message, "Parece que todos los recursos están libres :wink:");
          }
             
        });
  
    }

    /** Utils */

    // (Async) get info user by id
    function userInfo(api, id, next){
        api.users.info({
           user: id
        }, function (err, res) {
            next(err, res.user);
        });
    }

    // Generate list of users
    function generateQueueList(queue) {
        
        var text = 'La cola `'+queue.id+'` se compone de los siguientes usuarios: \n';

        queue.users.forEach(function(user, i){                
            text = text + '> `' +  (i + 1) + 'º` ' +  user.name + '\n';            
        });

        return text;
    }

    // Find user by id
    function findUser(users, id){
        
        return users.find(function(user, i){ return (user.id === id);});                
    }

};
