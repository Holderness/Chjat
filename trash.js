  
  <script src="/socket.io/socket.io.js"></script>
  <script src="https://cdn.socket.io/socket.io-1.2.0.js"></script>
  <script src="/js/lib/jquery.js"></script>
   <script src="/js/lib/autosize.min.js"></script>
  <script src="/js/lib/underscore.js"></script>
  <script src="/js/lib/backbone.js"></script>
  <script src="/js/lib/bootstrap.js"></script>
  <script src="/js/lib/moment.js"></script>
  <script src="/js/lib/livestamp.js"></script>
  <script src="/js/lib/wow.js"></script>
  <script src="/js/lib/progressbar.js"></script>
<!--   // <script src="/js/views/chatbox.js"></script> -->
<!--   // <script src="/js/views/direct-message.js"></script>
  // <script src="/js/views/direct-messages.js"></script> -->

  <script src="/js/models/chat-models.js"></script>
  <script src="/js/views/main.js"></script>
  <script src="/js/socketclient.js"></script>
  <script src="/js/main.js"></script>




// to create user chats

  //    var chatroom =  new ChatroomModel({
  //   name: "DOO",
  //   chatlog: [{room: "DOO", sender: "harumphtr", message: "harootr"}],
  // });
  // chatroom.save( function( err ) {
  //   if (!err) {
  //     return console.log('chatroom created');
  //   } else {
  //     return console.log( err );
  //   }
  // });

  // var varys = ChatroomModel.find({}, function( err, chatroom ) {
  //   if (!err) {
  //     console.log( chatroom );
  //   } else {
  //     return console.log( err );
  //   }
  // });

  // ChatroomModel.find( {name: "ATAT"} , function( err, chatroom ) {
  //   return chatroom.remove( function( err ) {
  //     if (!err) {
  //      console.log( 'Chatroom removed' );
  //    } else {
  //      console.log( err );
  //    }
  //  });
  // });





    socket.on('login', function(user) {
      // username length validation
      user = self.user;
         console.log('by god its manageConnection: ', user);
      var username = user.username;

      var nameBad = !username || username.length < 3 || username.length > 10;
      if (nameBad) {
        socket.emit('loginNameBad', username);
        return;
      }

      // username exists validation
      var nameExists = _.some(self.users, function(user) {
        return user.username == username;
      });
      if (nameExists) {
        socket.emit("loginNameExists", username);
      } else {
        // if username does not exist, create user, passes in user name and the socket
        // keep in mind this model is not a backbone UserModel, it's a server User model
        // defined at the bottom of this page
        var newUser = new User({ username: username, socket: socket });

        //pushes User model to online user array
        self.users.push(newUser);

        // calls method below
        self.setResponseListeners(newUser);

        // joins default room
        self.addToRoom(newUser, socket, 'DOO');

        // emits 'welcome' and 'userJoined' to the chatclient
        socket.emit("welcome");
        // self.io.sockets.emit("userJoined", newUser.username);
      }
    });
























 _whenScrolling = function() {

    $stickies.each(function(i) {

      var $thisSticky = $(this),
          $stickyPosition = $thisSticky.offset().top;


        var $prevSticky = $stickies.eq(i - 1),
            $prevStickyTop = $prevSticky.offset().top,
            $prevStickyPosition = $prevSticky.data('originalPosition');

       // console.log('stickyPos', $stickyPosition)
       // console.log('scrotop', $('.chatbox-content').scrollTop());
      // if ($stickyPosition === $('.chatbox-content').scrollTop() - $('.chatbox-content').height()) {
      if ($stickyPosition >= 195 && $stickyPosition <= 215) {
          
            var $nextSticky = $stickies.eq(i + 1),
            $nextStickyPosition = $nextSticky.data('originalPosition'),
            $nextStickyTop = $nextSticky.offset().top,
            $thisAndPrevStickyDifference = Math.abs($prevSticky.data('originalPosition') - $thisSticky.data('originalPosition')),
            $thisAndNextStickyDifference = Math.abs($nextSticky.data('originalPosition') - $thisSticky.data('originalPosition'));
         if ($prevStickyTop + $thisAndPrevStickyDifference <= 205) {
              $thisSticky.addClass("fixed");
         }
        // console.log('if pos', $stickyPosition);
        console.log('-------------');
        console.log('prevstickyoriginposition', $prevStickyPosition);
        console.log('prevstickytop', $prevStickyTop);
         console.log('$thisAndPrevStickyDifference', $thisAndPrevStickyDifference);
        console.log('thisStickyTop', $stickyPosition);
        console.log('$thisAndNextStickyDifference', $thisAndNextStickyDifference);
        console.log('nextStickyTop', $nextStickyTop);
        console.log('nextstickyoriginposition', $nextStickyPosition);
                 console.log('-------------');

         // console.log('2ifpos', $nextStickyPosition);
         if ($nextSticky.length > 0 && $nextSticky.hasClass("fixed")) {
           $nextSticky.removeClass("fixed");
           // $nextSticky.removeClass("z");
           //            $thisSticky.removeClass("fixed");
           // $prevSticky.addClass("fixed");
                       // debugger;

    
           console.log('prev', $prevSticky)
           console.log('this', $thisSticky)
           console.log('next', $nextSticky)
         }

         if ($prevStickyTop + $thisAndPrevStickyDifference > 205) {
            $thisSticky.removeClass("fixed");
            $prevSticky.addClass("fixed");
            // $prevSticky.addClass("z");
         }

        if ($prevSticky.length > 0 && $prevSticky.hasClass("fixed")) {
           $prevSticky.removeClass("fixed");
           // $prevSticky.removeClass("z");
           console.log('prev', $prevSticky)
           console.log('this', $thisSticky)
           console.log('next', $nextSticky)
         }
        
        // if ($nextSticky.length > 0 && $stickyPosition >= $nextStickyPosition) {
        //   console.log('weeeee');
        //   $thisSticky.addClass("absolute").css("top", $nextStickyPosition);
        // }

       } else {

        // var $prevSticky = $stickies.eq(i - 1);
        // var $prevStickyTop = $prevSticky.offset().top;
        // console.log($thisSticky);
        $thisSticky.removeClass("fixed");

        // if ($prevSticky.length > 0 && $('.chatbox-content').scrollTop() <= $thisSticky.data('originalPosition') - $('.chatbox-content').height()) {
        //   console.log('ELSE IFFFFFFFFF DHHHHH');
        //   $prevSticky.removeClass("absolute").removeAttr("style");
        // }
      }
    });
  };
















  