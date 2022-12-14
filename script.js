
const loadCSS = (settings, fileName) => {
    const { path, version } = settings;
    const linkTag = `<link href="${path}/${fileName}?v=${version}" type="text/css" rel="stylesheet">`

    document.querySelector('head').insertAdjacentHTML('beforeend', linkTag)
}


define(['jquery', 'underscore', 'twigjs'], function ($, _, Twig) {
  var CustomWidget = function () {
    var self = this;

	this.get_Tags = async () => {
		const tags = await fetch("https://mysupertestaccount.amocrm.ru/api/v4/contacts/tags").then(data => data.json())
		return tags._embedded.tags
	}

	this.get_list_from_constants = (entity, data={}) => {
		let from_constants = AMOCRM.constant(entity)
		data = Object.assign(data, from_constants)
		let result_list = []
		for (const element in data){
			result_list.push(data[element])
		}
		return result_list
	}

    this.getTemplate = _.bind(function (template, params, callback) {
      params = (typeof params == 'object') ? params : {};
      template = template || '';

      return this.render({
        href: '/templates/' + template + '.twig',
        base_path: this.params.path,
        v: this.get_version(),
        load: callback
      }, params);
    }, this);

    this.callbacks = {
      render: function () {
        
        return true;
      },
      init: _.bind(function () {
        console.log('init');

        AMOCRM.addNotificationCallback(self.get_settings().widget_code, function (data) {
          console.log(data)
        });

        this.add_action("phone", function (params) {
          /**
           * код взаимодействия с виджетом телефонии
           */
          console.log(params)
        });

        this.add_source("sms", function (params) {
          /**
           params - это объект в котором будут  необходимые параметры для отправки смс

           {
             "phone": 75555555555,   // телефон получателя
             "message": "sms text",  // сообщение для отправки
             "contact_id": 12345     // идентификатор контакта, к которому привязан номер телефона
          }
           */

          return new Promise(_.bind(function (resolve, reject) {
              // тут будет описываться логика для отправки смс
              self.crm_post(
                'https://example.com/',
                params,
                function (msg) {
                  console.log(msg);
                  resolve();
                },
                'text'
              );
            }, this)
          );
        });

        return true;
      }, this),
      bind_actions: function () {
        console.log('bind_actions');
        return true;
      },
      settings: function () {
        console.log("setting")
        return true;
      },
      onSave: function () {
        alert('click');
        return true;
      },
      destroy: function () {

      },
      contacts: {
        //select contacts in list and clicked on widget name
        selected: function () {
          console.log('contacts');
        }
      },
      leads: {
        //select leads in list and clicked on widget name
        selected: function () {
          console.log('leads');
        }
      },
      tasks: {
        //select taks in list and clicked on widget name
        selected: function () {
          console.log('tasks');
        }
	},
	advancedSettings:async function () {

		const element_visible_control = (element, is_visible)=>{
			if (!element) {
				return
			}
			is_visible ? element.slideDown(500) : element.slideUp(500)
		}

    	const managers = self.get_list_from_constants("managers"),
			tags = await self.get_Tags(),
			$work_area = $('#list_page_holder'),
			settings = self.get_settings()
		let tasks = {key_1:{
					icon_id: 6,
					id:1,
					option:"Связаться",
					color: "769f41"},
				key_2:{
					icon_id: 70,
					id:2,
					option:"Встреча",
					color:"7b5f24"},
			}
		
		tasks = self.get_list_from_constants("task_types", tasks)
		loadCSS(settings, 'style.css')
    	
		let data = await fetch("https://70e8-77-95-90-50.eu.ngrok.io/post",
			{method: "POST",
			headers: {
				'Content-Type': 'application/json',
				"ngrok-skip-browser-warning":"drgf",
				"User-Agent":"ne mozila"
			},
			body: JSON.stringify({managers, tags, tasks})
			}).then(page => {return page.text()})


		$work_area.append(data);
		
		const $current_manager = $("#current_manager"),
			$actions = $("#_actions"),
			$delay_time = $("#delay_time"),
			$task_date = $("#task_date"),
			$task_responsible = $("#task_responsible"),
			$task_type = $("#task_type"),
			$task_text = $("#task_text"),
			$tags = $("#add_tags"),
			$new_responsible = $("#change_task_responsible"),
			$message = $("#message"),
			$my_button = $('#my_button')

		$my_button.on('click', ()=>{
			console.log("кур мен ", $current_manager.val())
			console.log("action ", $actions.val())
			console.log("delay ", $delay_time.val())
			console.log("taskdate ", $task_date.val())
			console.log("task respons ", $task_responsible.val())
			console.log("type ", $task_type.val())
			console.log("task text ", $task_text.val())
			console.log("tags ", $tags.val())
			console.log("new respons ", $new_responsible.val())
			console.log("message ", $message.val())
		})

		
		
		const $time_input = $("#delay_time")
		const $select_actions = $("#actions")
		// const $choice_user_or_department = $(
		// 	Twig({ref:'/tmpl/controls/select.twig'}).render({
		// 		name:"Выбор пользователя / отдела",
		// 		items: managers,
		// 		id: "choice_manager",
		// 		title: "Выбор пользователя / отдела",
		// 		additional_data: '',
		// 	}));

		// const $time_input = $(
		// 	  Twig({ref:'/tmpl/controls/input.twig'}).render({
		// 	    placeholder: "Введите время ожидания в минутах",
		// 	    id: "delay_time",
		// 	  })
		// 	);
			
			
		// const $select_actions = $(
		// 	  Twig({ref:'/tmpl/controls/checkboxes_dropdown.twig'}).render({
		// 	    name: "Выбер действий",
		// 	    items: [{option:'Задача', name:"task", id:1, value:1, data_value: 1}, 
		// 	    {option:'Тег', name:"tag", id:2, value:2, data_value: 2}, 
		// 	    {option:'Смена ответственного', name:"responsible", id:3, value:3, data_value: 3}, 
		// 	    {option:'Уведомление в Telegram', name:"notice", id:4, value:4, data_value: 4}],
		// 	    id:"actions_1"
		// 	  })
		// 	);
	
			
		

	

    const $block_of_settings = {
		$block_choice_task: $("#task_settings"),
    	$block_choice_tag: $("#tag_settings"),
    	$block_choice_responsible: $("#change_responsible"),
    	$block_choice_notice: $("#notice")
		}

	const $control_of_settings = $select_actions.find('[type=checkbox]')
	
	$control_of_settings.on("change", event=>{
		element_visible_control(
			$block_of_settings[`$block_choice_${event.currentTarget.name}`], 
			event.currentTarget.checked)
		})
        // const id = $("#select_manager")
        // id.on("change", () => {console.log(id.val())})
          

        //   $save_button = $(
        //     Twig({ref: '/tmpl/controls/button.twig'}).render({
        //       text: 'Сохраaaaнить',
        //       class_name: 'button-input_blue button-input-disabled js-button-save-' + self.get_settings().widget_code,
        //       additional_data: ''
        //     })
        //   ),
        //   $cancel_button = $(
        //     Twig({ref: '/tmpl/controls/cancel_button.twig'}).render({
        //       text: 'Отмена',
        //       class_name: 'button-input-disabled js-button-cancel-' + self.get_settings().widget_code,
        //       additional_data: ''
        //     })
        //   );

        // console.log('advancedSettings');

        // $save_button.prop('disabled', true);
        // $('.content__top__preset').css({float: 'left'});
        // $('.list__body-right__top').css({display: 'block'})
        //   .append('<div class="list__body-right__top__buttons"></div>');
        // $('.list__body-right__top__buttons').css({float: 'right'})
        //   .append($cancel_button)
        //   .append($save_button);

        

        // self.getTemplate('advanced_settings', {}, function (template) {
        //   var $page = $(
        //     template.render({title: self.i18n('advanced').title, widget_code: self.get_settings().widget_code})
        //   );
        
        // 
        // );
        // $time_input = $(
        //   Twig({ref:'/tmpl/controls/input.twig'}).render({
        //     placeholder: "Введите время ожидания в минутах",
        //     id: "delay_time",
        //     additional_data: ''
        //   })
        // );

        // $select_actions = $(
        //   Twig({ref:'/tmpl/controls/checkboxes_dropdown.twig'}).render({
        //     name: "Выбер действий",
        //     items: [{option:'Иванов', name:"Ivan", id:1}, 
        //     {option:'Петров', name:"NeIvan", id:2}, 
        //     {option:'Сидоров', name:"Cidr", id:3}, 
        //     {option:'Маск', name:"Ilon", id:4}],
        //     additional_data: ''
        //   })
        // );

        // $end_of_task = $(
        //   Twig({ref:'/tmpl/controls/date_field.twig'}).render({
        //     placeholder: "Введите время ожидания в минутах",
        //     id: "task_date",
        //     additional_data: '',
        //     placeholder: "Со сроком выполнения: в момент события"
        //   })
        // );

        //   $work_area.append($page);
        //   $work_area.append($choice_user_or_department);
        //   $work_area.append($time_input);
        //   $work_area.append($select_actions);
        //   $work_area.append($end_of_task);
        // });
      },

      /**
       * Метод срабатывает, когда пользователь в конструкторе Salesbot размещает один из хендлеров виджета.
       * Мы должны вернуть JSON код salesbot'а
       *
       * @param handler_code - Код хендлера, который мы предоставляем. Описан в manifest.json, в примере равен handler_code
       * @param params - Передаются настройки виджета. Формат такой:
       * {
       *   button_title: "TEST",
       *   button_caption: "TEST",
       *   text: "{{lead.cf.10929}}",
       *   number: "{{lead.price}}",
       *   url: "{{contact.cf.10368}}"
       * }
       *
       * @return {{}}
       */
      onSalesbotDesignerSave: function (handler_code, params) {
        var salesbot_source = {
            question: [],
            require: []
          },
          button_caption = params.button_caption || "",
          button_title = params.button_title || "",
          text = params.text || "",
          number = params.number || 0,
          handler_template = {
            handler: "show",
            params: {
              type: "buttons",
              value: text + ' ' + number,
              buttons: [
                button_title + ' ' + button_caption,
              ]
            }
          };

        console.log(params);

        salesbot_source.question.push(handler_template);

        return JSON.stringify([salesbot_source]);
      },
    };
    return this;
  };

  return CustomWidget;
});