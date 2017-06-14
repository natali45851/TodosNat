$(function(){
// ��������  ������������ ������ ������ Todo �� ������ ������������� Backbone.Model (� ���� ��������� ���� �����������)
  var Todo = Backbone.Model.extend({
    defaults: function() {
      return {
// �������� �� ��������� ��� ������� �������� ������ �����.
        title: "����� ������",
        order: Todos.nextOrder(),
        done: false
      };
    },
    initialize: function() {
// �������� �������� �������� title (�������� �������� ������� get()), ���� NO ��������������� �������� �� ��������� ������� set())
      if (!this.get("title")) {
        this.set({"title": this.defaults.title});
             }
    },
// ����� toggle �������� ��� ������������� checkbox ������ ��������  �� ���������������
    toggle: function() {
      this.save({done: !this.get("done")});
    },
// �����  clear ������� ������  �� localStorage 
        clear: function() {
        this.destroy(); 
    }

  });
// Todo Collection 
// ��������� todos �������������� � ������� ���������� ��������� (localStorage), ��� ������ DB �� ��������� �������.
// C������ ����������� ����� ��������� TodoList
  var TodoList = Backbone.Collection.extend({
    model: Todo,
    localStorage: new Store("todos-backbone"),// � DOM ->localStorage �  ������ todos-backbone �������� ������, ������� �� ����� 
    done: function() {
// ������ �� ������ �����, ������� ���� ���������. done=false
      return this.filter(function(todo){ return todo.get('done'); });
    },
// ������ �� ������ �����, ������� �� ��� ��� �� ���������. done=true
    remaining: function() {
      return this.without.apply(this, this.done());
    },
// ����� ���������� ��������� ����� ������, ���� ������ ��� �� ����� - return 1
    nextOrder: function() {
      if (!this.length) return 1;
      return this.last().get('order') + 1;
    },
// ���������� �� ������ ������
    comparator: function(todo) {
      return todo.get('order');
    }

  });
  
// ������� ���� ��������� Todos
  var Todos = new TodoList;
//�������� ������ ������ ������������� TodoView
// ���� -   ��� ������������� ��  �������������� ��������, � ������ ������ ��, ��� ������������� change
  var TodoView = Backbone.View.extend({

// ������� DOM ���  ������ <ul> ����� li (����� ����������� �������, ������� ������� ���� � ������ �������� ������)
    tagName:  "li", 
// �������� ��������� ������ ������������ �� ������ �� id="item-template", ���� template, ����� ������������ ��� ������� ������� �������� � ������
   template: _.template($('#item-template').html()),
// DOM �������,  ��� �������������� ����������
// �.� ��������, ��� ����� �� ������ toggle ����������� ����� toggleDone � �.�.
    events: {
      "click .toggle"   : "toggleDone",
      "dblclick .view"  : "edit",
      "click a.destroy" : "clear",
      "keypress .edit"  : "updateOnEnter",
      "blur .edit"      : "close"
    },
   
    initialize: function() {
       
// �����������  ������� render � ������� model,  ������� ����� ���������� ������ ���, ����� ��������� ������� change 
      this.model.bind('change', this.render, this);
// ����������� ������� remove � model  �� �������  destroy      
      this.model.bind('destroy', this.remove, this);
    },
// ��������� �������� � ������ 
    render: function() {      
      this.$el.html(this.template(this.model.toJSON()));
      this.$el.toggleClass('done', this.model.get('done'));
      this.input = this.$('.edit');
      return this;
    },
// ��������� �������, ������� �������� � events:
    toggleDone: function() {
      this.model.toggle(); //������������� checkbox 
    },
// ����������� ������������� � ����� ��������������(�������� ����� editing)
    edit: function() {
      this.$el.addClass("editing");
      this.input.focus();
    },
// ��������� ����� �������������� edit, �������� ��������� � ������ todo.
    close: function() {
      var value = this.input.val();
      if (!value) this.clear();
      this.model.save({title: value});
      this.$el.removeClass("editing");
    },
 // �� ������� �� enter ����� �� ������ ��������������
    updateOnEnter: function(e) {
      if (e.keyCode == 13) this.close();
    },
// �������� ��������(������) �� ������(���������)
    clear: function() {
      this.model.clear();
    }
  });
// �������� ������ ������ ������������� AppView(������� �������������)
  var AppView = Backbone.View.extend({
 // ���������  ������������� �  HTML �� id todoapp,����� ����������� ��������� � ����� todoapp 
  el: $("#todoapp"),
// ��������� ������  ���������� � �������  �� id stats-template (��� ������� ����������)
    statsTemplate: _.template($('#stats-template').html()),
// ���������  �������, ��� �������������� ����������
// �.� ��������, ��� ����� ������ ������� ����������� ����� createOnEnter � �.�.
    events: {
      "keypress #new-todo":  "createOnEnter",
      "click #clear-completed": "clearCompleted",
      "click #toggle-all": "toggleAllComplete"
    },
// ��� ������������� �� ���������� ��������������� ������� �� ��������� Todos, �� ���������� ��� ��������� �������� ������ �����. ��� ��� ��������� ����� ��������� � localStorage. 
    initialize: function() {
      this.input = this.$("#new-todo"); // �������������� ������ ��� ����� ����� ������
      this.allCheckbox = this.$("#toggle-all")[0];// � ������ type=Checkbox ��� ���������
      Todos.bind('add', this.addOne, this); // �������  addOne (���������� ����� ������) ����������� � ��������� �� ������� add
      Todos.bind('reset', this.addAll, this); // ������� addAll ����������� � Todos �� ������� reset
      Todos.bind('all', this.render, this); // ������� render ����������� � Todos �� ������� all
      this.footer = this.$('footer');// �������� ������ footer
      this.main = $('#main');//� this.main ���������� �������� DOM ���������� main 
      Todos.fetch();//��������� ������ � localStorage
    },
//��������� ���������� 
    render: function() {
      var done = Todos.done().length; // ����������� ����������� ������� � ���������
     
      var remaining = Todos.remaining().length; // ����������� ������������� ������� � ���������

      if (Todos.length) { //����� ������� � ���������
        this.main.show(); // show ����� ������ 
        this.footer.show(); //show ����������
        this.footer.html(this.statsTemplate({done: done, remaining: remaining}));// ��������� ������������� � ������� ���a � HTML
      } else { // ���� ��� ������� ������ main � footer
        this.main.hide();
        this.footer.hide();
      }

      this.allCheckbox.checked = !remaining; 
   
    },
// ������� addOne ��������� ���� �������(model) � ������ �����
      addOne: function(todo) {
      var view = new TodoView({model: todo}); // ������� view(�������������)��� ����� ������
      this.$("#todo-list").append(view.render().el); //� ��������  � todo-list
    },
// ������� addAll ��������� ��� �������� ��������� Todos � ������������� ����� �� ������� reset)
      addAll: function() {
      Todos.each(this.addOne);
    },
    createOnEnter: function(e) {
 // ��� ������� �� ������� "Enter" � �������� ���� �����, ��������� ����� ������ Todo, � ���������� � localStorage,���� �� Enter ��� �� ����������� ���� ������ �� ���������
      if (e.keyCode != 13) return;
      if (!this.input.val()) return;
      Todos.create({title: this.input.val()});
      this.input.val('');
    },
// �������  ��� ����������� �������� ������, ��������� �� ������.
   clearCompleted: function() {
      _.each(Todos.done(), function(todo){ todo.clear();});
      return false;
    },
// �������� ��� checked ��� �������� ������ (��� ��, ��� ����������)
    toggleAllComplete: function () {
      var done = this.allCheckbox.checked;
      Todos.each(function (todo) { todo.save({'done': done}); });
    }

  });
 // �����r ���������� App 
 var App = new AppView;

});

