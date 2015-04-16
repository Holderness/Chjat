

var thomJones =
		{
			name: 'Thom Jones',
			avatar: 'http://nuruinternational.org/annual-report/wp-content/uploads/2014/07/Jake.jpg',
			id: 1
		};
var tomJones = 
		{
			name: 'Tom Jones',
			avatar: 'http://a5.files.biography.com/image/upload/c_fill,cs_srgb,dpr_1.0,g_face,h_300,q_80,w_300/MTE1ODA0OTcyMDA1Njg4ODQ1.jpg',
			id: 2
		};
var ev = 
		{
			name: 'Evan Turner',
			avatar: 'http://evturn.com/assets/img/ev-winter-yellow.jpg',
			id: 3
		};

var convo1 = new Conversation({				
					users: [tomJones, thomJones],
					messages:	[
							{
								timestamp: new Date(),
								content: 'Craig, it\'s important. I just spilled salsa all over my filas.',
								sender: tomJones
							},
							{
								timestamp: new Date(),
								content: 'I\m not Craig!',
								sender: thomJones
							},
							{
								timestamp: new Date(),
								content: 'Fuck the hell off!',
								sender: thomJones
							}
						]
					});
var convo2 = new Conversation({
				users: [tomJones, thomJones],			
				messages:	[
						{
							timestamp: new Date(),
							content: 'Craig, it\'s important. I just spilled salsa all over my filas.',
							sender: tomJones
						},
						{
							timestamp: new Date(),
							content: 'I\m not Craig!',
							sender: thomJones
						},
						{
							timestamp: new Date(),
							content: 'Just ate a bisquit',
							sender: tomJones
						}
					]
				});
var convo3 = new Conversation({
				users: [ev, thomJones],
				messages:	[
						{
							timestamp: new Date(),
							content: 'Craig, it\'s important. I just spilled salsa all over my filas.',
							sender: tomJones
						},
						{
							timestamp: new Date(),
							content: 'I\m not Craig!',
							sender: thomJones
						},
						{
							timestamp: new Date(),
							content: 'Please leave my wife in this',
							sender: ev
						}
					]});

var u2 = new User(thomJones);

var u1 = new User({
			name: 'Tom Jones',
			avatar: 'http://a5.files.biography.com/image/upload/c_fill,cs_srgb,dpr_1.0,g_face,h_300,q_80,w_300/MTE1ODA0OTcyMDA1Njg4ODQ1.jpg',
			inbox: 
				[
					convo1,
					convo2,
					convo3
				],	
			id: 1
		});


new Sidebar({model: u1});

new WOW(
    { offset: 120 }
).init();