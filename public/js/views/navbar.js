var app = app || {};

(function ($) {

  app.NavbarView = Backbone.View.extend({
    el: '.login-menu',
    template: _.template($('#navbar-template').html()),
    invitationTemplate: _.template($('#invitation-template').html()),
    events: {
      'click .delete-invitation': 'deleteInvitation',
      'click .accept-invitation': 'acceptInvitation',
    },
    initialize: function(options) {
      this.vent = options.vent;
      this.model = new app.UserModel({ username: '', invitations: new app.InvitationCollection() });
      this.listenTo(this.model, "change", this.render, this);

      var invitations = this.model.get('invitations');

      this.listenTo(invitations, "reset", this.renderInvitations, this);
    },
    render: function() {
      this.$el.html(this.template(this.model.toJSON()));
      this.renderInvitations();
      return this;
    },
    renderInvitations: function() {
      this.$('#invitations').empty();
      var invitations = this.model.get('invitations');
      var this_ = this;
      invitations.each(function(invite) {
        this_.renderInvitation(invite);
      }, this);
    },
    renderInvitation: function(model) {
      this.$('#invitations').append(this.invitationTemplate(model.toJSON()));
    },
    deleteInvitation: function(e) {
      var roomId = $(e.target).data('roomid');
      this.vent.trigger('deleteInvitation', roomId);
    },
    acceptInvitation: function(e) {
      var roomId = $(e.target).data('roomid');
      this.vent.trigger('acceptInvitation', roomId);
    },

  });

})(jQuery);