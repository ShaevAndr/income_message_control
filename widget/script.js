define(['jquery', 'underscore', 'twigjs', './modules/settingsREON/settings-reon.js'], function ($, _, Twig, settingREON) {

	const loadCSS = (settings, fileName) => {
		const { path, version } = settings;
		const linkTag = `<link href="${path}/${fileName}?v=${version}" type="text/css" rel="stylesheet">`
	
		document.querySelector('head').insertAdjacentHTML('beforeend', linkTag)
	}
	
	const URL = "https://widev6.reon.pro/widgets/mcontroller";
	
	var CustomWidget = function () {
    var self = this;
	const SUBDOMAIN = self.system().subdomain;

	this.get_Tags = async () => {
		const deals_tags = await fetch(`https://${SUBDOMAIN}.amocrm.ru/api/v4/leads/tags`).then(data => data.json()).then(data => data._embedded.tags).catch(()=>{return []})
		const contacts_tags = await fetch(`https://${SUBDOMAIN}.amocrm.ru/api/v4/contacts/tags`).then(data => data.json()).then(data => data._embedded.tags).catch(()=>{return []})
		const customers_tags = await fetch(`https://${SUBDOMAIN}.amocrm.ru/api/v4/customers/tags`).then(data => data.json()).then(data => data._embedded.tags).catch(()=>{return []})
		const companies_tags = await fetch(`https://${SUBDOMAIN}.amocrm.ru/api/v4/companies/tags`).then(data => data.json()).then(data => data._embedded.tags).catch(()=>{return []})
		
		return {deals_tags, contacts_tags, customers_tags, companies_tags}
	}
	// Получение списка типов задач/менеджеров
	this.get_list_from_constants = (entity) => {
		let data = {}
		if (entity === "task_types") {
			data = {key_1:{
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
		}
		let from_constant = AMOCRM.constant(entity)
		if (entity === "managers") {
			from_constant = Object.values(from_constant).filter(manager=>manager.active)
		}
		data = Object.assign(data, from_constant)
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

	init: _.bind(async function () {

	AMOCRM.addNotificationCallback(self.get_settings().widget_code, function (data) {
	});
	
	const es = new EventSource(`${URL}/notification?subdomain=${SUBDOMAIN}&id=${AMOCRM.constant('user').id}`);
	
	es.addEventListener("notification", (event)=>{
		const message_params = {
			header: "У Вас пропущенное сообщение",
			text: `${event.data}`
		};
		AMOCRM.notifications.add_error(message_params);
	})

	return true;
	}, this),

	bind_actions: function () {
	return true;
	},

	settings: async () => {
		const settings = self.get_settings();
		const SUBDOMAIN = self.system().subdomain;
		const settingPattern = new settingREON(self, settings)
		loadCSS(settings, './modules/settingsREON/style-settings.css')
	
		settingPattern.insertFooterLinksBlock()
	
	
					settingPattern.createSettingsBody([
						{
							name: 'Настройки',
							id: 'reon_main_settings',
							main: true
						},
						{
							name: 'Подписка',
							id: 'reon_payment'
						}
					]);
	
					const mainSettingBody = document.querySelector(`[id-body="reon_main_settings"]`)
					mainSettingBody.insertAdjacentElement('beforeend', settingPattern.returnAndRemoveStandartSettingsInput('client_name'))
					mainSettingBody.insertAdjacentElement('beforeend', settingPattern.returnAndRemoveStandartSettingsInput('phone_number'))
					settingPattern.createCheckbox(mainSettingBody, 'terms_of_use', 'Я прочитал(-а) <a href="https://drive.google.com/file/d/13HBl0vCbeyxANlA3VszC57_xZP-IJbpw/view" target="_blank">Условия</a> соглашения и согласен(-на) с условиями')
	
					const reonPaymentBody = document.querySelector(`[id-body="reon_payment"]`)
					settingPattern.insertForwardToContact(reonPaymentBody)
					settingPattern.insertPriceBlock(reonPaymentBody, 'beforeend', [
						{
							title: 'Минимальный срок оплаты виджета',
							period: '6 месяцев',
							value: '2 994 ₽',
							active: true
						},
						{
							title: '2 месяца работы виджета в подарок при оплате',
							period: '10 месяцев',
							value: '4 990 ₽'
						}
					])
	
					settingPattern.insertSubscribeTimeInfo(reonPaymentBody, SUBDOMAIN);
	
					const termsOfUseField = document.querySelector('[name="terms_of_use"]')
					if (termsOfUseField.value === '') {
						document.querySelector('.widget_settings_block__controls').insertAdjacentHTML('beforebegin', AIWidget.settingsWarningTemplate)
					}
					return true;
		},
	
	onSave: function () {
		const SUBDOMAIN = self.system().subdomain;
		const settings = self.get_settings();
		const userNameInputSetting = document.querySelector('input[name="client_name"]');
		const phoneNumberInput = document.querySelector('input[name="phone_number"]');
		const termsOfUseField = document.querySelector(`input[name="terms_of_use"]`);
		const accountId = AMOCRM.constant("account").id;
		const enumId = 1070339;
		try{
			fetch(`https://${SUBDOMAIN}.amocrm.ru/api/v4/webhooks`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({
					"destination": `${URL}/change_talk`,
					"settings": ["update_talk"]
				})
			})
			fetch(`https://${SUBDOMAIN}.amocrm.ru/api/v4/webhooks`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({
					"destination": `${URL}/new_message`,
					"settings": ["add_message"]
				})
			})
		} catch {("Не удалось установить вебхуки")}
		try {
			fetch(`${URL}/informer`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({
					userName: userNameInputSetting.value,
					userPhone: phoneNumberInput.value,
					account: String(accountId),
					widgetName: "Контроль сообщений",
					termsOfUse: termsOfUseField.value,
					enumId: enumId,
					accountSubdomain: self.system().subdomain,
					widgetStatus: settings.active,
					client_uuid: settings.oauth_client_uuid,
				})
			})
		} catch {console.debug("Произошла ошибка при обращении к серверу")}
		return true;
	},
	destroy: function () {
	// Удаление вебхуков
	try{
		fetch(`https://${SUBDOMAIN}.amocrm.ru/api/v4/webhooks`, {
			method: "DELETE",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				"destination": `${URL}/change_talk`,
			})
		})
		fetch(`https://${SUBDOMAIN}.amocrm.ru/api/v4/webhooks`, {
			method: "DELETE",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				"destination": `${URL}/new_message`,
			})
		})
	} catch {console.debug("Произошла ошибка при обращении к серверу")}
	},

	advancedSettings:async function () {
	
	const sort_managers_by_group = (managers_with_group) => {
		const groups = managers_with_group.filter(element=>element.id.startsWith("group"))
		let sorted_list_of_managers = []
		for (let group of groups ) {
			sorted_list_of_managers.push(group)
			for (let element of managers_with_group) {
				if (element.group === group.id) {
					sorted_list_of_managers.push(element)
				}
			}
		}
		return sorted_list_of_managers
	}
	
    
	const get_managers_with_group = (managers) => {
		let color_index = 0;
		const colors = ['#fffeb2', '#deff81', '#fffd7f', '#87f2c0', '#ffeab2', '#ebffb1', '#ffdc7f', '#ffce5a', '#ffdbdb', '#ffc8c8', '#ff8f92', '#d6eaff', '#c1e0ff', '#98cbff', '#f9deff', '#f3beff', '#ccc8f9', '#eb93ff', '#f2f3f4', '#e6e8ea'];
		let managers_with_group = [...managers];
		const groups = AMOCRM.constant("groups");
		for (let key of Object.keys(groups)) {
			if (color_index >= colors.length) {
				color_index = 0
			};
			managers_with_group.push({
				option: groups[key],
				id: key,
				group: true,
				bg_color: colors[color_index]
			});
			color_index++
		};
		return sort_managers_by_group(managers_with_group)
	};
		// Настройки программы

	const managers = self.get_list_from_constants("managers"),
	tags = await self.get_Tags(),
	$work_area = $('#list_page_holder'),
	settings = self.get_settings(),
	tasks = self.get_list_from_constants("task_types"),
	managers_with_group = get_managers_with_group(managers),
	managers_with_responsible = [{option:"Ответсвенный за сделку", id: -1}, ...managers]
	
	// Получение списка всех действий
	const all_actions = await fetch(`${URL}/get_actions`,
		{method: "POST",
		headers: {
			'Content-Type': 'application/json',
			},
		body: JSON.stringify({subdomain: SUBDOMAIN})
	}).then(page => page.json()).then(data=>data).catch(()=>{console.debug("произошла ошибка при запросе")});
	
	
	// Обработка тэгов
	
	const new_tag = (title, id="", color="white") => {
		return `<div class="reon-msgctrl__tag_wrapper">
					<div class="reon-msgctrl__tag" data-tag-id=${id} style="background:${color}">
						<span>${title}</span>   
					</div>
					<svg class="svg-icon svg-common--trash-dims reon__delete_tag">
                    	<use class="reon__delete_tag" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#common--trash"></use>
                	</svg>
				</div>`
	}

	const tag_in_list = (name, id="", color="") => {

		return `<div class="reon-msgctrl__add_tag_row">
			<div class="reon-msgctrl__tag" data-tag-id=${id} style="background:${color}">
				<span>${name}</span>
			</div>
			<svg class="reon-msgctrl__add_tag_button" width="15px" height="15px"><use xlink:href="#digital_pipeline--add_trigger"></use></svg>
			<div class="reon-msgctrl__add_tag_wrapper"></div>
		</div>`
	}

	const refresh_tag_list = (element) => {
		fetch(`https://${SUBDOMAIN}.amocrm.ru/api/v4/leads/tags`)
		.then(data => data.json())
		.then(data => data._embedded.tags)
		.then(data => {
			const tags_block = element.querySelector(".reon-msgctrl__tag_list")
			element.querySelector("input").value = ""
			tags_block.replaceChildren()
			data.forEach(tag=>{
				tags_block.insertAdjacentHTML('beforeend', tag_in_list(tag.name, tag.id, tag.color || ""))
			})

		})
	}

	const add_new_tag = async (name, entity="leads") => {
		let new_tags = []
		if (Array.isArray(name)) {
			name.forEach(tag=>{
				new_tags.push({
					name: tag.name
				})
			})
		} else {
			new_tags.push({name})
		}
		return fetch(`https://${SUBDOMAIN}.amocrm.ru/api/v4/${entity}/tags`,
			{method: "POST",
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(new_tags)
			}
		)
	}
// select user
	const reset_select_user_block = (id) => {
		const input_field = document.querySelector(`#reon-reon-msgctrl_find${id}`)
		const users_list = document.querySelector(`#reon-msgctrl__manager_list${id}`)
		input_field.style.color = "black"
		input_field.value = ""
		const const_managers_list_block = document.querySelector('#reon-msgctrl__user_select_block_constant').cloneNode(true)
		const const_managers_list = const_managers_list_block.querySelectorAll('span')
		users_list.replaceChildren()
		const_managers_list.forEach(manager=>{
			manager.dataset.id = id
			users_list.appendChild(manager)
		})
	}
// schedule
	const day_audit = (schedule_block) => {
		const days = schedule_block.querySelectorAll(".reon_schedule_day")
		let active_days = 0
		for (const day of days) {
			const day_is_active = day.querySelector(".reon_day_choice").checked
			if (day_is_active) {
				active_days++
				if (!day.querySelector(".reon_time_input_from").value || !day.querySelector(".reon_time_input_to").value){
					return false
				}
				if (day.querySelector(".reon_time_input_from").value >= day.querySelector(".reon_time_input_to").value){
					return false
				}
			}
		}
		if (!active_days) {
			return false
		}
		return true
	}

	const disable_day_tag = (day)=> {
		const tag = day.querySelector(".reon_day_tag")
		tag.classList.remove('reon_enabled_day')
		tag.classList.add('reon_disabled_day')
		day.querySelector(".reon_time_input_from").disabled=true
		day.querySelector(".reon_time_input_to").disabled=true
	}
	const enabled_day_tag = (day)=> {
		const tag = day.querySelector(".reon_day_tag")
		tag.classList.add('reon_enabled_day')
		tag.classList.remove('reon_disabled_day')
		day.querySelector(".reon_time_input_from").disabled=false
		day.querySelector(".reon_time_input_to").disabled=false
	}

	const check_schedule_save_button_status = (schedule_is_correct, save_button) => {
		const button_status = save_button.dataset.active === "Y" ? true : false
		if (schedule_is_correct === button_status) {
		   return
	   }
	   if (schedule_is_correct) {
		   save_button.dataset.active = "Y"
		   save_button.classList.remove('reon_disable_save_button')
		   save_button.classList.add('reon_enable_save_button')
	   } else {
		   save_button.dataset.active = "N"
		   save_button.classList.remove('reon_enable_save_button')
		   save_button.classList.add('reon_disable_save_button')
	   }
	}

	document.addEventListener('change', event=>{
	// tags checkboxes
		if (event.target.classList.contains("reon__switcher__checkbox")){
			const current_checkbox_label = event.target.parentNode
			if (event.target.checked){
				current_checkbox_label.classList.add('reon__switcher__on')
				current_checkbox_label.classList.remove('reon__switcher__off')
			} else {
				current_checkbox_label.classList.add('reon__switcher__off')
				current_checkbox_label.classList.remove('reon__switcher__on')
			}
		}
// schedule
		if(event.target.classList.contains("reon_time_input_from") || event.target.classList.contains("reon_time_input_to")) {
			const schedule_is_correct = day_audit(event.target.closest(".reon_schedule_content"))
			const save_button = event.target.closest(".reon_schedule_content").querySelector(".reon_save_schedule_button")
			check_schedule_save_button_status(schedule_is_correct, save_button)
		}

		if (event.target.classList.contains("reon_day_choice")) {
			const day_block = event.target.closest(".reon_schedule_day")
			const tag = day_block.querySelector(".reon_day_tag")
			if (event.target.checked) {
	
				tag.classList.remove('reon_disabled_day')
				tag.classList.add('reon_enabled_day')
				day_block.querySelector(".reon_time_input_from").disabled=false
				day_block.querySelector(".reon_time_input_to").disabled=false
	
			} else {
				disable_day_tag(day_block)
			}
			const schedule_is_correct = day_audit(day_block.closest(".reon_schedule_content"))
			const save_button = event.target.closest(".reon_schedule_content").querySelector(".reon_save_schedule_button")
			check_schedule_save_button_status(schedule_is_correct, save_button)
		}

	})
// принимает class=reon_schedule_content
	const close_schedule = (current_schedule)=> {
		current_schedule.style.display = "none"
		const all_days = current_schedule.querySelectorAll('.reon_schedule_day')
		all_days.forEach(day => {
			const day_checkbox = day.querySelector(".reon_day_choice")
			const day_checkbox_prev_value = day_checkbox.dataset.value==="true" ? true : false 
			if (!day_checkbox_prev_value && day_checkbox.checked) {
				day_checkbox.checked = false
				disable_day_tag(day)
			}
			if (day_checkbox_prev_value && !day_checkbox.checked) {
				day_checkbox.checked = true
				enabled_day_tag(day)
			}
			const from = day.querySelector(".reon_time_input_from")
			from.value = from.dataset.currentValue
			const to = day.querySelector(".reon_time_input_to")
			to.value = to.dataset.currentValue
			if (!to.value || !from.value) {
				day.querySelector(".reon_day_choice").checked = false
				disable_day_tag(day)
			}
		})
	}
// Принимает reon_schedule_content или reon_schedule_wrapper
	const get_schedule = (current_schedule) => {
		const days = current_schedule.querySelectorAll(".reon_schedule_day")
		let schedule = []
		days.forEach(element=>{
			const day_info = {
				checked: element.querySelector(".reon_day_choice").checked,
				day: element.dataset.day,
				name: element.dataset.name,
				from: element.querySelector(".reon_time_input_from").value,
				to: element.querySelector(".reon_time_input_to").value
			}
			schedule.push(day_info)
		})
		return schedule
	}

	
	document.addEventListener('click', async event=>{
		const select_tag_checkboxes = document.querySelectorAll('.reon-msgctrl__tag_select_checkbox')
		const select_manager_checkboxes = document.querySelectorAll('.reon-msgctrl__select_user_checkbox')
// schedule

		select_tag_checkboxes.forEach(checkbox=>{
			if (checkbox.checked) {

				let select_tag_block = checkbox.parentNode.querySelector('.reon-msgctrl__tag_select_block')
				let target = event.target;

				const is_tag_click = select_tag_block.contains(target);
				if (!is_tag_click  && select_tag_block.style.display==="flex") {
					select_tag_block.style.display = "none"
					checkbox.checked = false
					const open_select_button = checkbox.parentNode.querySelector(".reon-msgctrl__open_tag_select")
					open_select_button.style.display = "flex"

				}
			}
			})

		if (event.target.classList.contains("reon_save_schedule_button")) {
			if (event.target.dataset.active === "N") {
				return
			}

			const current_schedule = event.target.closest('.reon_schedule_wrapper')
			current_schedule.querySelector('.reon_schedule_is_edit').checked = false
			const all_day_select_checkboxes = current_schedule.querySelectorAll(".reon_day_choice")
			all_day_select_checkboxes.forEach(checkbox=> {
				const current_value = checkbox.checked ? "true" : "false"
				checkbox.dataset.value = current_value
			})
			const all_time_input = [...current_schedule.querySelectorAll(".reon_time_input_from"), ...current_schedule.querySelectorAll(".reon_time_input_to")]
			all_time_input.forEach(input=>{
				input.dataset.currentValue = input.value
			})
			const schedule = get_schedule(current_schedule)
			close_schedule(current_schedule.querySelector(".reon_schedule_content"))
			const schedule_demo = current_schedule.parentNode.querySelector('.reon__schedule_demo')
			self.render({
				href: '/templates/schedule_demo.twig', //путь до шаблона
				base_path: self.params.path, //базовый путь до директории с виджетом
				load: (template)=>{
					try {
					const new_schedule_demo =  template.render({
						days: schedule
					}
					)
					schedule_demo.replaceChildren()
					schedule_demo.insertAdjacentHTML('afterbegin', new_schedule_demo)
					
					} catch {
						()=>{console.debug("Ошибка загрузки шаблона")}
					}
				}
			})
		}
		
		if (event.target.classList.contains("reon_edit_schedule_button") || event.target.classList.contains("reon_edit_schedule")) {
			const current_schedule = event.target.closest('.reon_schedule_wrapper')
			const schedule_is_edit = current_schedule.querySelector('.reon_schedule_is_edit')
			if (schedule_is_edit.checked) {
				schedule_is_edit.checked = false
				close_schedule(current_schedule.querySelector(".reon_schedule_content"))
			} else {
				const schedule_is_correct =  day_audit(current_schedule)
				check_schedule_save_button_status(schedule_is_correct, current_schedule.querySelector(".reon_save_schedule_button"))
				schedule_is_edit.checked = true
				current_schedule.querySelector('.reon_schedule_content').style.display = "flex"
			}
			
		}

		if (event.target.classList.contains("reon__close_schedule_content")) {
			const current_schedule = event.target.closest('.reon_schedule_wrapper')
			current_schedule.querySelector('.reon_schedule_is_edit').checked = false
			close_schedule(event.target.parentNode)
			
		}
		
		// tags edit
		if (event.target.classList.contains("reon__create_tag") || event.target.classList.contains("reon__new-tag")) {
			const tag_select_block = event.target.closest('.reon-msgctrl__tag_select_block')
			const name = tag_select_block.querySelector("input").value
			await add_new_tag(name)
			refresh_tag_list(tag_select_block)
			tag_select_block.querySelector("input").value = ""
			const create_block = tag_select_block.querySelector(".reon__create_tag_block")
			create_block.dataset.isNew = ""
			create_block.style.display = "none"

		}

		if (event.target.classList.contains("reon-msgctrl__open_tag_select")) {

			const parentBlock = event.target.parentNode
			const isOpen = parentBlock.querySelector("[type=checkbox]")
			isOpen.checked = true
			parentBlock.querySelector(".reon-msgctrl__tag_select_block").style.display = "flex"
			event.target.style.display = "none"
		}
		
		if (event.target.classList.contains("reon__close_select_tag")) {
			const select_block = event.target.parentNode
			select_block.style.display = "none"
			const open_select_button = select_block.parentNode.querySelector(".reon-msgctrl__open_tag_select")
			open_select_button.style.display = "flex"
			select_block.parentNode.querySelector(".reon-msgctrl__tag_select_checkbox").checked=false
	
		}
	
		if (event.target.classList.contains("reon-msgctrl__add_tag_wrapper")) {
			const parentBlock = event.target.closest(".reon-msgctrl__tag_select_wrapper")
			const selected_tags_block = parentBlock.querySelector(".reon-msgctrl__selected_tags")
			const selected_tag = event.target.parentNode.firstElementChild
			const selected_tags = selected_tags_block.querySelectorAll('.reon-msgctrl__tag')
			for (element of selected_tags.values()) {
			if (selected_tag.dataset.tagId === element.dataset.tagId){
				return}
			}
			selected_tags_block.insertAdjacentHTML('afterbegin', new_tag(selected_tag.firstElementChild.innerText, selected_tag.dataset.tagId, selected_tag.style.background))
	
		}
	
		if (event.target.classList.contains("reon__delete_tag")) {
			const element = event.target.closest(".reon-msgctrl__tag_wrapper")
			element.remove()
		}

		// User managment
		if (event.target.classList.contains("reon_msgctrl__users_list")){
			event.stopPropagation()
			const id = event.target.dataset.id
			const manager_name = document.querySelector(`#reon-msgctrl__manager${id}`)
			manager_name.innerText = event.target.innerText
			manager_name.dataset.managerId = event.target.dataset.managerId
			manager_name.dataset.currentManagerId = event.target.dataset.managerId
			manager_name.dataset.currentManagerName = event.target.innerText
			document.querySelector(`#reon-msgctrl__manager_block${id}`).classList.add("hidden")
			document.querySelector(`#reon-msgctrl__manager_select_checkbox${id}`).checked = false 
			reset_select_user_block(id)
			manager_name.classList.remove("reon-msgctrl__user_field_notactiv")
		}


		select_manager_checkboxes.forEach(checkbox=>{
			if (checkbox.checked) {
				let select_manager_block = checkbox.parentNode
				let target = event.target;
				const manager_name = select_manager_block.previousElementSibling
				const id = manager_name.dataset.id
				const is_manager_select = select_manager_block.contains(target);
				if (!is_manager_select  && !select_manager_block.classList.contains("hidden")) {
	
					manager_name.innerText = manager_name.dataset.currentManagerName
					manager_name.dataset.managerId = manager_name.dataset.currentManagerId
					manager_name.classList.remove("reon-msgctrl__user_field_notactiv")
					select_manager_block.classList.add("hidden")
					checkbox.checked = false
					reset_select_user_block(id)
				}
			}
			})
		
		
		

		if (event.target.classList.contains("reon-msgctrl__user_field")) {
			const id = event.target.dataset.id
			const select_checkbox = document.querySelector(`#reon-msgctrl__manager_select_checkbox${id}`)
			if (select_checkbox.checked) {
				return
			}
			event.target.classList.add("reon-msgctrl__user_field_notactiv")
			select_checkbox.checked = true
			const managers_block = document.querySelector(`#reon-msgctrl__manager_block${id}`)
			managers_block.classList.remove('hidden')
		}
	
	
	
	})
	
	document.addEventListener('input', async event=>{
		
		if (event.target.classList.contains("reon-msgctrl__find_tag")) {
			const query_search = event.target.value
			const tag_list = event.target.nextElementSibling
			const tags = await fetch(`https://${SUBDOMAIN}.amocrm.ru/api/v4/leads/tags`).then(data => data.json()).then(data => data._embedded.tags).catch(()=>{return []})
			const relevants_tags = tags.filter(tag=>{
				return tag.name.includes(query_search)
			})
			tag_list.replaceChildren()
			if (!relevants_tags.length) {
				tag_list.nextElementSibling.querySelector(".reon__new-tag").innerText = query_search
				tag_list.nextElementSibling.style.display = "block"
				tag_list.nextElementSibling.dataset.isNew = "true"
			}
			else{
				tag_list.nextElementSibling.style.display = "none"
				tag_list.nextElementSibling.dataset.isNew = ""
				relevants_tags.forEach(tag=> {
					tag_list.insertAdjacentHTML('beforeend', tag_in_list(tag.name, tag.id, tag.color))
				})
			}
		}
// User find
		if (event.target.classList.contains("reon-msgctrl__find_user")){
			const costant_managers_list_block = document.querySelector('#reon-msgctrl__user_select_block_constant').cloneNode(true)
			const constant_managers_list = costant_managers_list_block.querySelectorAll('span')
			
			let array_of_managers =[...constant_managers_list]
			const value = event.target.value
			const id = event.target.dataset.id
			const manager_name = document.querySelector(`#reon-msgctrl__manager${id}`)
			const managers_list_block = document.querySelector(`#reon-msgctrl__manager_list${id}`)
	
			managers_list_block.replaceChildren()
			array_of_managers = array_of_managers.filter(manager=>manager.innerText.startsWith(value) || manager.dataset.managerId.startsWith("group"))
			const have_managers = array_of_managers.filter(manager=>!manager.dataset.managerId.startsWith("group")).length
			const have_relevant_group = array_of_managers.filter(manager=>manager.innerText.startsWith(value) && manager.dataset.managerId.startsWith("group")).length
			let relevant_index = 0
			if (have_managers || have_relevant_group) {
				for (let index in array_of_managers) {
					if (array_of_managers[index].innerText.startsWith(value)) {
						relevant_index = index
						break
					}
				}
				event.target.style.color = "black"
				array_of_managers.forEach(manager=>{
					manager.dataset.id = id
					managers_list_block.appendChild(manager)
				})
				manager_name.innerText = array_of_managers[relevant_index].innerHTML
				manager_name.dataset.managerId = array_of_managers[relevant_index].dataset.managerId
				manager_name.dataset.currentManagerId = array_of_managers[relevant_index].dataset.managerId
				manager_name.dataset.currentManagerName = array_of_managers[relevant_index].innerHTML
			} else {
				event.target.style.color = "red"
				manager_name.innerText = ''
			}
		}

		if (event.target.classList.contains("reon__delay")) {
			let value = Number(event.target.value)
			if (value<5){
				event.target.nextElementSibling.innerText="Минимальное время 5 минут"
				event.target.value = 5
				return
			}
			if (value>3000){
				event.target.nextElementSibling.innerText="Максимальное время 3000 минут"
				event.target.value = 3000

			}
			else {
				event.target.nextElementSibling.innerText=""
			}
		}


	})
	
	document.addEventListener('keydown', async event=>{
		if (event.target.classList.contains("reon-msgctrl__find_tag") && event.key === 'Enter') {
			const tag_select_block = event.target.parentNode
			const check_new_tag = tag_select_block.querySelector(".reon__create_tag_block").dataset.isNew
			if (check_new_tag) {
				await add_new_tag(event.target.value)
				refresh_tag_list(tag_select_block)
				tag_select_block.querySelector(".reon__create_tag_block").dataset.isNew = ""
				tag_select_block.querySelector(".reon__create_tag_block").style.display = "none"
			}
		}
	})
	

	

	self.render({
        href: '/templates/control_settings.twig', //путь до шаблона
        base_path: self.params.path, //базовый путь до директории с виджетом
        load: (template)=>{
			try {
			$work_area.append(template.render({
				managers_with_responsible: managers_with_responsible,
				managers: managers,
				managers_with_groups: managers_with_group,
				tags: tags.deals_tags,
				tasks: tasks,
				message_control: all_actions}))
			} catch {
				()=>{console.debug("Ошибка загрузки шаблона")}
			}
			const $add_button = $("#add_setting_button")
			$add_button.on('click', ()=>{
				$("#add_settings_row").show();
				$add_button.hide();
			})
		}
    })
 

	const get_selected_tags = (id) => {
		const tags = document.querySelector(`#reon-msgctrl__selected_tags${id}`).querySelectorAll('.reon-msgctrl__tag_wrapper')
		
		const selected_tags = Array.from(tags).map(element=>{
			return {id: element.querySelector(".reon-msgctrl__tag").dataset.tagId,
					color: element.querySelector(".reon-msgctrl__tag").style.background,
					name:element.querySelector("span").innerText
					}
		})

		return selected_tags

	}

	// Добавление, удаление или изменение параметров действия
	const send_changes = async (action, changes) => {
		return fetch(`${URL}/data_change`,
		{method: action,
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({subdomain: SUBDOMAIN, changes})
		})
		.then(data=>data.json())
		.then(data=>data)
		.catch(()=>{console.debug("Ошибка обращения к серверу")})
	}

	// Получение типов действий при добавлении/изменении настройки
	const get_action_type = (action_selector) => {
		let actions_list = []
		const checkboxes = action_selector.find("input")
		for (let i=0; i<checkboxes.length; i++) {
			if (checkboxes[i].checked) {
				actions_list.push(checkboxes[i].value)
			}
		}

		return get_actions(actions_list)
	}
	

	const get_actions = (actions_list) => {
		// Конвертирует список действий в список объектов для шаблона twig
		let actions = [{option:'Задача',  id:"task", value:"task", color: "#4c8bf7"}, 
		{option:'Смена ответственного', id:"responsible", value:"responsible", color: "rgb(155,168,174)"}, 
		{option:'Тег', id:"tag", value:"tag", color: "rgb(30,144,255)"}, 
		{option:'Уведомление в центр нотификации', id:"notice", value:"notice", color: "rgb(137,206,176)"}]
		actions = actions.map(action=>{
			if (actions_list.includes(action.value)){
				action.is_checked = true
			}
			return action
		})
		return actions
	}
      
	// формирует объект нового условия для действия 
    const get_new_condition = (task_type, id="") => {
		const current_manager = document.querySelector(`#reon-msgctrl__manager${id}`).dataset.managerId,
		$actions = $(`#actions${id}`),
		$delay_time = $(`#delay_time${id}`),
		$task_date = $(`#task_date${id}`),
		$task_responsible = $(`#task_responsible${id}`),
		$task_type = $(`#task_type${id}`),
		$task_text = $(`#task_text${id}`),
		$new_responsible = $(`#change_task_responsible${id}`),
		$message = $(`#message${id}`),
		schedule_block = document.querySelector(`#reon_schedule_content${id}`),
		tag_on_contact = document.querySelector(`#tag_on_contact${id}`).checked,
		tag_on_company = document.querySelector(`#tag_on_company${id}`).checked

		let new_setting = {
			timezone: AMOCRM.constant("account").timezone,
			manager: managers_with_group.find(manager=>manager.id==current_manager),
			schedule: get_schedule(schedule_block),
			delay_time: $delay_time.val() || 5,
			action_type: get_action_type($actions),
			tag_on_contact,
			tag_on_company
		}
		if (id){
			new_setting._id = id.slice(1)
		}
		for (let condition of new_setting.action_type) {
			if (condition.is_checked) {
				switch (condition.value) {
					case 'task': {
						new_setting.task = {
							date:$task_date.val() || 'today',
							type: task_type.find(task=>task.id==$task_type.val()),
							responsible: managers_with_responsible.find(manager=>manager.id==$task_responsible.val()),
							text: $task_text.val() || "У Вас неотвеченное сообщение"
							}
							continue
					}
					case 'responsible': {
						new_setting.new_responsible = managers_with_responsible.find(manager=>manager.id==$new_responsible.val())
						continue
					}
					case 'tag': {
						new_setting.tags = get_selected_tags(id)
						const tags_name = new_setting.tags.map(tag=>{return {name: tag.name}})
						if (tag_on_contact){
							add_new_tag(tags_name, "contacts")
						}
						if (tag_on_company){
							add_new_tag(tags_name, "companies")
						}
						continue
					}
					case 'notice': {
						new_setting.notice = $message.val() || "У Вас неотвеченное сообщение"
						continue
					}
				}
			}
		}
		return new_setting
    }

	// Вывести/убрать действие при настройке в зависимости от выбранного типа действия
	const element_visible_control = (element, is_visible)=>{
		if (!element) {
			return
		}
		is_visible ? element.slideDown(500) : element.slideUp(500)
	}
		
	$work_area.on("mouseover", async (event)=>{
		
			if (event.target.classList.contains("reon_msgctrl__users_list")){
				const id = event.target.dataset.id
				const manager_name = document.querySelector(`#reon-msgctrl__manager${id}`)
				manager_name.innerText = event.target.innerText
			}
		})
	
	
	$work_area.on("click", async (event)=>{
		if(event.target.id === 'reon-cancel_delete' ){
			document.querySelector('#reon-delete_task').style.display = "none"
		}
		
		if (event.target.id === "save_control_setting" || event.target.id === "save_control_setting_span") {
			const data = get_new_condition(tasks)
			send_changes("POST", data)
			.then(new_condition=>{ 
				all_actions.push(new_condition)					
				self.render({
					href: '/templates/condition_row.twig',
					base_path: self.params.path, 
					load: (template)=>{
						$("#add_settings_row").after(template.render({
							managers_with_responsible: managers_with_responsible,
							managers: managers,
							managers_with_group: managers_with_group,
							tags: tags.deals_tags,
							tasks: tasks,
							selected_condition: new_condition
						}))
					}
				})
				$("#add_setting_button").show()
				$("#add_settings_row").hide()
			})
			.then(()=> {
				self.render({
					href: '/templates/add_condition.twig',
					base_path: self.params.path, 
					load: (template)=>{
						const new_chunk = template.render({
							managers_with_groups: managers_with_group,
							tags: tags,
							managers_with_responsible: managers_with_responsible,
							managers: managers,
							tasks: tasks
						})
						const add_new_setting = document.querySelector("#add_settings_row")
						add_new_setting.replaceChildren(new_chunk)
						add_new_setting.innerHTML = new_chunk
					}
				})
			})
			.catch(()=>console.debug("Данные не получены"))
		}

		// Открывает настройки действия при изменении 
		if (event.target.dataset.action == "change") {
			const row_id = event.target.dataset.id
			$(`#view_row_${row_id}`).hide()
			$(`#edit_row_${row_id}`).show()
		}
		// Отменяет изменение настроек действия
		if (event.target.dataset.action == "cancel") {
			if (event.target.dataset.id === "add_setting") {
				$("#add_settings_row").hide()
				$("#add_setting_button").show()
				return
			}
			const row_id = event.target.dataset.id
			$(`#edit_row_${row_id}`).hide()
			$(`#view_row_${row_id}`).show()
		}
		// Удаляет действие
		if (event.target.dataset.action == "delete") {
			const row_id = event.target.dataset.id
			const modal = document.querySelector('#reon-delete_task')
			modal.dataset.id = row_id
			modal.style.display = "block"
			
		}

		if(event.target.id === 'reon-delete_condition') {
			const modal = document.querySelector('#reon-delete_task')
			const row_id = modal.dataset.id
			send_changes("DELETE", row_id)
			.then(()=>$(`#view_row_${row_id}`).hide())
			.catch(()=>{console.debug("сервер не отвечает")})
			modal.dataset.id = ""
			modal.style.display = "none"
		}

		// Сохраняет действие
		if (event.target.dataset.action == "save") {
			const row_id = event.target.dataset.id
			condition = get_new_condition(tasks, `_${row_id}`);
			send_changes("PATCH", condition)
			.then((data)=>{
				const $row = $(`#edit_row_${row_id}`)
				$(`#view_row_${row_id}`).remove()
				self.render({
					href: '/templates/condition_row.twig',
					base_path: self.params.path, 
					load: (template)=>{
						$row.replaceWith(template.render({
							managers_with_responsible: managers_with_responsible,
							managers: managers,
							managers_with_group: managers_with_group,
							tags: tags.deals_tags,
							tasks: tasks,
							selected_condition: data
						}))
					}
				})
			})
			.catch(()=>{console.debug("данные не обновились")})
		}
		// Показывает настройки при нажатии на определённый тэг действия
		if (event.target.dataset.type === "action_tag") {
			const selected_info = $(`#${event.target.dataset.target}`)
			const info_cell = selected_info.parent()
			info_cell.children().hide()
			selected_info.show()
		}
	})


	// Отслеживает изменения при нажатии выбора типа действия 
	$work_area.on('change', (event) => {
		const $parent = $(event.target).closest("[id^='action']")
		let id = $parent.attr("data-id")
		id = id ? `_${id}` : ""
		if (event.target.name === "actions_choice"){
			const $block_of_settings = {
						$block_choice_task: $(`#task_settings${id}`),
						$block_choice_tag: $(`#tag_settings${id}`),
						$block_choice_responsible: $(`#change_responsible${id}`),
						$block_choice_notice: $(`#notice${id}`)
						}
					element_visible_control(
						$block_of_settings[`$block_choice_${event.target.value}`], event.target.checked)
		}
	})
},
    };
    return this;
  };

  return CustomWidget;
});