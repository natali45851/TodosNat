$(function(){
// Создание  собственного класса модели Todo на основе существующего Backbone.Model (и этим расширяем свои возможности)
  var Todo = Backbone.Model.extend({
    defaults: function() {
      return {
// Атрибуты по умолчанию для данного элемента списка задач.
        title: "Новая задача",
        order: Todos.nextOrder(),
        done: false
      };
    },
    initialize: function() {
// Проверка значения атрибута title (значение получают методом get()), если NO устанавливается значение по умолчанию методом set())
      if (!this.get("title")) {
        this.set({"title": this.defaults.title});
             }
    },
// Метод toggle Работает как переключатель checkbox меняет значения  на противоположное
    toggle: function() {
      this.save({done: !this.get("done")});
    },
// Метод  clear удаляет данные  из localStorage 
        clear: function() {
        this.destroy(); 
    }

  });
// Todo Collection 
// Коллекция todos поддерживается с помощью локального хранилища (localStorage), это вместо DB на удаленном сервере.
// Cоздаем собственный класс коллекции TodoList
  var TodoList = Backbone.Collection.extend({
    model: Todo,
    localStorage: new Store("todos-backbone"),// В DOM ->localStorage с  именем todos-backbone хранятся данные, которые мы ввели 
    done: function() {
// Фильтр по списку задач, которые были завершены. done=false
      return this.filter(function(todo){ return todo.get('done'); });
    },
// Фильтр по списку задач, которые до сих пор не закончены. done=true
    remaining: function() {
      return this.without.apply(this, this.done());
    },
// Метод возвращает следующий номер списка, если ничего еще не ввели - return 1
    nextOrder: function() {
      if (!this.length) return 1;
      return this.last().get('order') + 1;
    },
// Сортировка по номеру списка
    comparator: function(todo) {
      return todo.get('order');
    }

  });
  
// Создаем свою коллекцию Todos
  var Todos = new TodoList;
//Создание своего класса представления TodoView
// Цель -   без необходимости не  перерисовывать страницу, а менять только то, что действительно change
  var TodoView = Backbone.View.extend({

// Элемент DOM для  списка <ul> будет li (будем отслеживать события, которые описаны ниже в каждом элементе списка)
    tagName:  "li", 
// Значения атрибутов модели накладываютя на шаблон по id="item-template", этот template, потом используется для рендера каждого элемента в списке
   template: _.template($('#item-template').html()),
// DOM события,  для соотвествующих селекторов
// т.е например, при клики на объект toggle выполняется метод toggleDone и т.д.
    events: {
      "click .toggle"   : "toggleDone",
      "dblclick .view"  : "edit",
      "click a.destroy" : "clear",
      "keypress .edit"  : "updateOnEnter",
      "blur .edit"      : "close"
    },
   
    initialize: function() {
       
// Привязываем  функцию render к объекту model,  которая будет вызываться всякий раз, когда сработает событие change 
      this.model.bind('change', this.render, this);
// Привязываем функцию remove к model  по событию  destroy      
      this.model.bind('destroy', this.remove, this);
    },
// Рендеринг элемента в списке 
    render: function() {      
      this.$el.html(this.template(this.model.toJSON()));
      this.$el.toggleClass('done', this.model.get('done'));
      this.input = this.$('.edit');
      return this;
    },
// Описываем события, которые объявили в events:
    toggleDone: function() {
      this.model.toggle(); //переключатель checkbox 
    },
// Переключает представление в режим редактирования(добавлет класс editing)
    edit: function() {
      this.$el.addClass("editing");
      this.input.focus();
    },
// Закрывает режим редактирования edit, сохранив изменения в модели todo.
    close: function() {
      var value = this.input.val();
      if (!value) this.clear();
      this.model.save({title: value});
      this.$el.removeClass("editing");
    },
 // По нажатию на enter выход из режима редактирования
    updateOnEnter: function(e) {
      if (e.keyCode == 13) this.close();
    },
// Удаление елемента(модели) из списка(коллекции)
    clear: function() {
      this.model.clear();
    }
  });
// Создание своего класса представления AppView(главное представление)
  var AppView = Backbone.View.extend({
 // Связываем  представление с  HTML по id todoapp,будем отслеживать изменения в блоке todoapp 
  el: $("#todoapp"),
// Связываем шаблон  статистики с данными  по id stats-template (для рендера статистики)
    statsTemplate: _.template($('#stats-template').html()),
// Объявляем  события, для соотвествующих селекторов
// т.е например, при вводе нового задания выполняется метод createOnEnter и т.д.
    events: {
      "keypress #new-todo":  "createOnEnter",
      "click #clear-completed": "clearCompleted",
      "click #toggle-all": "toggleAllComplete"
    },
// При инициализации мы навешиваем соответствующие события на коллекцию Todos, на добавление или изменение элемента списка задач. Все эти изменения будут сохранены в localStorage. 
    initialize: function() {
      this.input = this.$("#new-todo"); // инициализируем объект для ввода новой модели
      this.allCheckbox = this.$("#toggle-all")[0];// и объект type=Checkbox для коллекции
      Todos.bind('add', this.addOne, this); // Функцию  addOne (добавления новой модели) привязываем к коллекции по событию add
      Todos.bind('reset', this.addAll, this); // Функцию addAll привязываем к Todos по событию reset
      Todos.bind('all', this.render, this); // Функцию render привязываем к Todos по событию all
      this.footer = this.$('footer');// выбираем объект footer
      this.main = $('#main');//В this.main выбираются элементы DOM селектором main 
      Todos.fetch();//получении данных с localStorage
    },
//Рендеринг приложения 
    render: function() {
      var done = Todos.done().length; // Колличество выполненных заданий в коллекции
     
      var remaining = Todos.remaining().length; // Колличество невыполненных заданий в коллекции

      if (Todos.length) { //Всего записей в коллекции
        this.main.show(); // show всего списка 
        this.footer.show(); //show статистики
        this.footer.html(this.statsTemplate({done: done, remaining: remaining}));// наложение шаблонизатора и вставка кодa в HTML
      } else { // если нет записей скрыть main и footer
        this.main.hide();
        this.footer.hide();
      }

      this.allCheckbox.checked = !remaining; 
   
    },
// Функция addOne добавляет один элемент(model) в список задач
      addOne: function(todo) {
      var view = new TodoView({model: todo}); // Создаем view(представление)для новой модели
      this.$("#todo-list").append(view.render().el); //и помещаем  в todo-list
    },
// Функция addAll добавляет все элементы коллекции Todos в представление сразу по событию reset)
      addAll: function() {
      Todos.each(this.addOne);
    },
    createOnEnter: function(e) {
 // При нажатии на клавишу "Enter" в основном поле ввода, создастся новая модель Todo, и сохранится в localStorage,если не Enter или не заполненное поле ничего не создается
      if (e.keyCode != 13) return;
      if (!this.input.val()) return;
      Todos.create({title: this.input.val()});
      this.input.val('');
    },
// Очищает  все завершенные элементы списка, уничтожая их модели.
   clearCompleted: function() {
      _.each(Todos.done(), function(todo){ todo.clear();});
      return false;
    },
// Отмечает как checked все элементы списка (как бы, все выполненно)
    toggleAllComplete: function () {
      var done = this.allCheckbox.checked;
      Todos.each(function (todo) { todo.save({'done': done}); });
    }

  });
 // запусr приложение App 
 var App = new AppView;

});

