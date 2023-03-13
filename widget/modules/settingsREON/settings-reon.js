define([], function () {
    function settingREONConstructor(self, settings) {
        class createSettingsClass {
            constructor() {
                this.$el = `<div class="reon_widget_settings">`;
                this.$nav = `<div class="reon_widget_settings-nav">`;
                this.$body = `<div class="reon_widget_settings-body">`;
            }
            appendItem(buttonInfo) {
                this.$nav += `<div class="reon_widget_settings-nav-item ${buttonInfo.main ? 'reon_widget_settings-nav-active' : ''}" id-nav="${buttonInfo.id}">
                    <span class="reon_widget_settings-nav-item-span">${buttonInfo.name}</span>
                </div>`;
                this.$body += `<div class="reon_widget_settings-body-item ${buttonInfo.main ? 'reon_widget_settings-body-item-show' : 'reon_widget_settings-body-item-hide'}" id-body="${buttonInfo.id}">
                </div>`;
            }
            close() {
                return this.$el + this.$nav + '</div>' + this.$body + '</div> </div>'
            }
            
        }
        const fetchIt = async (url) => {
            try {
                const json = await fetch(url);
                const response = await json.json();
                return response
            } catch (e) {
            }
        }
        const createTwigButton = (settings) => {
            return self.render({ ref: '/tmpl/controls/button.twig' }, settings);
        }
        const createTwigCheckbox = (settings) => {
            return self.render({ ref: '/tmpl/controls/checkbox.twig' }, settings);
        }
        const subscribeTimeFunc = async (subdomain) => {
            const res = await fetchIt(`https://widev6.reon.pro/widgets/mcontroller/status?subdomain=${subdomain}`)
            if (res.response === 'trial') {
                return {
                    text: `У вас действует тестовый период до ${new Date(res.finishUsingDate).toLocaleDateString()}.`,
                    class: `reon_widget_ai_modal-text-paid`
                }
            }
            if (res.response === 'paid') {
                return {
                    text: `Подписка на виджет действует до ${new Date(res.finishUsingDate).toLocaleDateString()}.`,
                    class: `reon_widget_ai_modal-text-paid`
                }
            }
            if (res.response === 'notPaid') {
                return {
                    text: `Подписка не оплачена, виджет не работает. Дата окончания подписки ${new Date(res.finishUsingDate).toLocaleDateString()}.`,
                    class: `reon_widget_ai_modal-text-notpaid`
                }
            } else {
                return {
                    text: `Не удалось получить информацию о статусе подписки.`,
                    class: `reon_widget_ai_modal-text-notpaid`
                }
            }
        }

        

        const subscribeTimeTemplate = (settings) => {
            return `<div class="widget_settings_block__item_field">
                <span class="reon_widget_ai_subscribe-time ${settings.class}">
                    ${settings.text}
                </span>
            </div>`
        }
        const findSettingsField = (name, clear) => {
            const field = document.querySelector(`input[name="${name}"]`);
            const block = field.closest('.widget_settings_block__item_field');
            const title = block.querySelector(".widget_settings_block__title_field");
            title.classList.add("reon_widget_ai_visually-hidden");
            field.classList.add("reon_widget_ai_visually-hidden");
            if (clear) {
                block.classList.add("reon_widget_ai_visually-hidden");
            }
            block.classList.remove('widget_settings_block__item_field')
            block.classList.add('reon_widget_settings-row')
            block.remove()
            return { block, field }
        }
        const checkboxDropdownTemplateParams = (boxClass, itemsArr) => {
            const items = []
            for (let i = 0; i < itemsArr.length; i++) {
                items.push({
                    id: i + 1,
                    option: itemsArr[i].text,
                    name: `checkbox-${itemsArr[i].name}`,
                    is_checked: String(itemsArr[i].isChecked) === 'true' ? true : false
                })
            }
            return {
                class_name: `${boxClass} reon_widget_settings-row`,
                items: items,
                name: boxClass
            }
        }
        const checkboxTemplateParams = (field) => {
            return {
                class_name: "reon-advanced-interface-widget-checkbox",
                input_class_name: `reon-advanced-interface-widget-checkbox-${field.name}`,
                name: `${field.name}-checkbox-item`,
                text: "Я прочитал(-а) ",
                value: field.value,
                checked: field.value === 'true' ? true : false
            }
        }
        const renderFieldFunc = (place, block, field, text) => {
            place.insertAdjacentElement('beforeend', block)
            const checkboxTemplate = self.render({ ref: '/tmpl/controls/checkbox.twig' }, checkboxTemplateParams(field));
            block.insertAdjacentHTML('beforeend', checkboxTemplate)
            const checkboxText = block.querySelector('.control-checkbox__text');
            checkboxText.textContent = '';
            checkboxText.style = "display: block; font-size: 14px;";
            checkboxText.insertAdjacentHTML('beforeend', text)
            const checkbox = block.querySelector('.reon-advanced-interface-widget-checkbox');
            checkbox.addEventListener('change', e => {
                field.value = e.target.checked;
            })
        }


        this.returnAndRemoveStandartSettingsInput = (name, hide = false) => {
            const settingsBody = document.querySelector('.widget-settings__desc-space');
            const input = settingsBody.querySelector(`[name="${name}"]`);
            const inputBody = input.closest('.widget_settings_block__item_field')
            const title = inputBody.querySelector('.widget_settings_block__title_field');
            title.classList.add('reon_widget_settings-label')
            inputBody.classList.remove('widget_settings_block__item_field')
            inputBody.classList.add('reon_widget_settings-row')
            if(hide) {
                inputBody.classList.add('reon_widget_ai_visually-hidden')
            }
            inputBody.remove()
            return inputBody
        }
        this.createCheckbox = (place, name, text) => {
            const { block: blockByName, field: fieldByName } = findSettingsField(name)
            renderFieldFunc(place, blockByName, fieldByName, text)
        }
        this.insertForwardToContact = (place) => {
            place.insertAdjacentHTML('beforeend',
                `
            <div class="reon_widget_settings-forwardToContact">
                <span>
                    Для получения счёта на оплату <a href="https://reon.pro/interface_amocrm" target="_blank">свяжитесь</a> с нами любым удобным для вас способом.
                </span>
            </div>
            `)
        }
        this.insertSubscribeTimeInfo = async (place, SUBDOMAIN) => {
            const subscribeTimeText = await subscribeTimeFunc(SUBDOMAIN);
            const subscribeTime = subscribeTimeTemplate(subscribeTimeText);
            place.insertAdjacentHTML('beforeend', subscribeTime);
        }
        this.createSettingsBody = (buttonsArray) => {
            const settingTemplateConstructor = new createSettingsClass();
            buttonsArray.forEach(buttonInfo => {
                settingTemplateConstructor.appendItem(buttonInfo)
            })
            const settingTemplate = settingTemplateConstructor.close()
    
            const controlButton = document.querySelector('.widget_settings_block__controls');
            controlButton.insertAdjacentHTML('beforebegin', settingTemplate)
    
            const settingsNavBar = document.querySelector('.reon_widget_settings-nav');
    
            const actionSettingsButton = (target) => {
                if (!target.classList.contains('reon_widget_settings-nav-active')) {
                    const settingsBody = target.closest('.reon_widget_settings');
                    const idNav = target.getAttribute('id-nav');
    
                    const oldActive = settingsBody.querySelector('.reon_widget_settings-nav-active');
                    oldActive.classList.remove('reon_widget_settings-nav-active')
                    target.classList.add('reon_widget_settings-nav-active')
    
                    const ativeBody = settingsBody.querySelector('.reon_widget_settings-body-item-show');
                    ativeBody.classList.remove('reon_widget_settings-body-item-show')
                    ativeBody.classList.add('reon_widget_settings-body-item-hide')
    
                    const newActiveBody = settingsBody.querySelector(`[id-body="${idNav}"]`)
                    newActiveBody.classList.remove('reon_widget_settings-body-item-hide')
                    newActiveBody.classList.add('reon_widget_settings-body-item-show')
                }
            }
            settingsNavBar.addEventListener('click', (e) => {
                if (e.target.classList.contains('reon_widget_settings-nav-item')) {
                    actionSettingsButton(e.target)
                } else if (e.target.tagName === 'SPAN') {
                    const target = e.target.closest('.reon_widget_settings-nav-item')
                    actionSettingsButton(target)
                } else {
                    const target = e.target.querySelector('.reon_widget_settings-nav-item')
                    actionSettingsButton(target)
                }
            })
        }
        this.createCheckboxDropdown = (place) => {
            settings.forEach(setting => {
                const multiSelect = self.render({ ref: '/tmpl/controls/checkboxes_dropdown.twig' }, checkboxDropdownTemplateParams(setting.class, setting.fields))
                place.insertAdjacentHTML('beforeend', multiSelect)
                place.querySelector(`.${setting.class}`).insertAdjacentHTML('beforebegin', `<label class="reon_widget_settings-label">${setting.label}</label>`)
                const fieldGroupCheckbox = document.querySelector(`.${setting.class}`);
                setting.fields.forEach(field => {
                    const { block: checkboxDropdownBlock, field: checkboxDropdownField } = findSettingsField(field.name, true)
                    place.insertAdjacentElement('beforebegin', checkboxDropdownBlock)
                    const label = fieldGroupCheckbox.querySelector(`[name="checkbox-${field.name}"]`).closest('label')
                    const observer = new MutationObserver(() => {
                        if (label.classList.contains('is-checked')) {
                            checkboxDropdownField.value = true
                        } else {
                            checkboxDropdownField.value = false
                        }
                    })
                    observer.observe(label, {
                        attributes: ['class']
                    })
                })
            })
        }
        this.insertFooterLinksBlock = () => {
            const settingsBlock = document.querySelector('.widget-settings__wrap-desc-space');
            settingsBlock.classList.add('reon_widget_settings-footer-relative')
            settingsBlock.insertAdjacentHTML('beforeend',
                `
            <div class="reon_widget_settings-footer">
                <div class="reon_widget_settings-footer-text">
                    Напишите нам и мы найдем решение вашей задачи.
                </div>
                <div class="reon_widget_settings-footer-contacts">
                    <div class="reon_widget_settings-footer-contacts-item">
                        <a href="https://reon.pro/interface_amocrm" target="_blank" >
                            <img src="https://thumb.tildacdn.com/tild3866-3438-4139-b137-323134633338/-/resize/175x/-/format/webp/Component_4.png" alt="reon.pro">
                        </a>
                    </div>
                    <div class="reon_widget_settings-footer-contacts-item">
                        <a href="mailto:reon.helpdesk@gmail.com" target="_blank">reon.helpdesk@gmail.com</a>
                    </div>
                    <div class="reon_widget_settings-footer-contacts-item">
                        <a href="tel:+79381083338" target="_blank">+7(938)-108-33-38</a>
                    </div>
                </div>
            </div>
            `)
        }
        this.insertAccessUsersBlock = async (place, position) => {
            const pallete = ['4682B4', 'DDA0DD', '191970', '5F9EA0', '8FBC8F', '9ACD32', 'FA8072', 'CD5C5C', 'FFD700', 'D2691E', 'A52A2A', 'BC8F8F', 'DEB887', '9370DB']
            const filters = [
                {
                    type: 'group',
                    value: 'all',
                },
                {
                    type: 'checked',
                    value: 'all',
                }
            ];
            const settingsAccessUser = settings.access_for_users ? Object.keys(JSON.parse(settings.access_for_users)) : [];
            const accGroupsWithColor = {}
            const accGroups = APP.constant('groups')
            delete accGroups.group_free_users;
            Object.keys(accGroups).forEach((groupId, indx) => {
                accGroupsWithColor[`${groupId}`] = {
                    id: groupId,
                    name: accGroups[groupId],
                    color: pallete[indx % 15]
                }
            });
            const accUsers = Object.entries(APP.constant('managers'))
                .filter(([key, obj]) => obj.active)
                .map(([key, obj]) => {
                    obj.group_name = accGroupsWithColor[`${obj.group}`].name;
                    obj.group_color = accGroupsWithColor[`${obj.group}`].color;
                    obj.checked = settingsAccessUser.includes(obj.id) ? true : false
                    return obj
                })
                .sort((a, b) => {
                    if (a.title.slice(0, 2) > b.title.slice(0, 2)) {
                        return 1
                    }
                    if (a.title.slice(0, 2) < b.title.slice(0, 2)) {
                        return -1
                    } else {
                        return 0
                    }
                })
    
            const filterAccessBlock = (filters, accUsers) => {
                let filteredList = accUsers;
                filters.forEach(filter => {
                    if (filter.value !== 'all') {
                        filteredList = filteredList.filter(user => user[filter.type] === filter.value)
                    }
                })
                return filteredList
            }
            const renderFilteredUsers = (users, self) => {
                let template = ``;
                const accessRowsBody = document.querySelector('.reon_widget_settings-access-body')
                users.forEach(user => {
                    template += `<div class="reon_widget_settings-access-row">
                    <div class="reon_widget_settings-access-name">
                        ${user.title}
                    </div>
                    <div class="reon_widget_settings-access-group" group-id="${user.group}" style="color: #${user.group_color}">
                        ${user.group_name}
                    </div>
                    <div class="reon_widget_settings-access-check">
                        ${createTwigCheckbox({
                        class_name: "reon_widget_settings-access-checkbox",
                        input_class_name: `reon_widget_settings-access-checkbox-${user.id}`,
                        name: `${user.id}`,
                        checked: user.checked
                    })}
                    </div>
                </div>`
                })
                accessRowsBody.innerHTML = template;
            }
            const clearFilters = (place, filters) => {
                const oldActive = place.querySelector('.reon_widget_settings-access-filter-list-item-active')
                const newActive = place.querySelector('[name="all"]')
                const current = place.querySelector('.reon_widget_settings-access-filter-current')
                current.textContent = newActive.textContent
                oldActive.classList.remove('reon_widget_settings-access-filter-list-item-active')
                newActive.classList.add('reon_widget_settings-access-filter-list-item-active')
                filters.forEach(filter => filter.value = 'all')
            }
    
            const renderAccessUsersBlock = async (accUsers) => {
                class createAccessUsersBlockClass {
                    constructor() {
                        class createGroupsFilterClass {
                            constructor() {
                                this.$el = `<div class="reon_widget_settings-access-filter" filter-type="group">
                                <div class="reon_widget_settings-access-filter-current">все</div>
                                <div class="reon_widget_settings-access-filter-list">
                                    <div class="reon_widget_settings-access-filter-list-item reon_widget_settings-access-filter-list-item-active" name="all">
                                        все
                                    </div>`
                            }
                            addGroup(group) {
                                this.$el += `<div class="reon_widget_settings-access-filter-list-item" style="color: #${group.color}" name="${group.id}">
                                ${group.name}
                            </div>`
                            }
                            closeGroup() {
                                return this.$el + `</div></div>`
                            }
                        }
                        const createGroupsFilter = new createGroupsFilterClass();
                        Object.keys(accGroups).forEach(group => {
                            createGroupsFilter.addGroup(accGroupsWithColor[group])
                        })
                        this.$groups = createGroupsFilter.closeGroup()
                        this.$el = `<div class="reon_widget_settings-access">
                        <div class="reon_widget_settings-access-heading ">
                            <div class="reon_widget_settings-access-name">
                                <div class="checkboxes_dropdown__item reon_widget_ai_list-search">
                                    <input class="reon_widget_ai_list-search-input" type="text" placeholder="Поиск">
                                </div>
                            </div>
                            <div class="reon_widget_settings-access-group">
                                ${this.$groups}
                            </div>
                            <div class="reon_widget_settings-access-check">
                                ${createTwigCheckbox({
                            class_name: "reon_widget_settings-access-checkbox-all",
                            input_class_name: `reon_widget_settings-access-checkbox-all-input`,
                            checked: settingsAccessUser.length === accUsers.length ? true : false
                        })}
                            <div class="reon_widget_settings-access-filter" filter-type="checked">
                                <div class="reon_widget_settings-access-filter-current">все</div>
                                <div class="reon_widget_settings-access-filter-list">
                                    <div class="reon_widget_settings-access-filter-list-item reon_widget_settings-access-filter-list-item-active" name="all">
                                        все
                                    </div>
                                    <div class="reon_widget_settings-access-filter-list-item" name="true">
                                        активные
                                    </div>
                                    <div class="reon_widget_settings-access-filter-list-item" name="false">
                                        не активные
                                    </div>
                                </div>
                            </div>
                            </div>
                        </div>
                        <div class="reon_widget_settings-access-body">`
                    }
                    addUser(user) {
                        this.$el += `<div class="reon_widget_settings-access-row">
                            <div class="reon_widget_settings-access-name">
                                ${user.title}
                            </div>
                            <div class="reon_widget_settings-access-group" group-id="${user.group}" style="color: #${user.group_color}">
                                ${user.group_name}
                            </div>
                            <div class="reon_widget_settings-access-check">
                                ${createTwigCheckbox({
                            class_name: "reon_widget_settings-access-checkbox",
                            input_class_name: `reon_widget_settings-access-checkbox-${user.id}`,
                            name: `${user.id}`,
                            checked: settingsAccessUser.includes(`${user.id}`) ? true : false
                        })}
                            </div>
                        </div>`
                    }
                    close() {
                        return this.$el + '</div></div>'
                    }
                }
                const accessUsersBlockTemplate = new createAccessUsersBlockClass(settings);
                accUsers.forEach(user => {
                    accessUsersBlockTemplate.addUser(user)
                })
                place.insertAdjacentHTML(position, accessUsersBlockTemplate.close())
    
                const accessRowsBody = document.querySelector('.reon_widget_settings-access-body')
                accessRowsBody.addEventListener('mouseup', (e) => {
                    if ((e.target.tagName === 'INPUT') && (e.target.getAttribute('type') === 'checkbox')) {
                        const parenLabel = e.target.closest('label');
                        const name = e.target.getAttribute('name');
                        const curentUser = accUsers.find(user => user.id === name)
                        setTimeout(() => {
                            if (parenLabel.classList.contains('is-checked')) {
                                curentUser.checked = true;
                            } else {
                                curentUser.checked = false;
                            }
                        }, 0)
                    }
                })
    
                const initializeFilter = (type, accUsers, filters, self) => {
                    const filter = document.querySelector(`.reon_widget_settings-access-filter[filter-type="${type}"]`);
                    const filterList = filter.querySelector('.reon_widget_settings-access-filter-list')
                    const filterCurrent = filter.querySelector('.reon_widget_settings-access-filter-current')
                    filter.addEventListener('mouseover', () => {
                        filterList.style.display = 'block';
                    })
                    filter.addEventListener('mouseout', () => {
                        filterList.style.display = 'none';
                    })
                    filterList.addEventListener('click', e => {
                        const actionOnFilterClick = (target, type, self) => {
                            if (type === 'checked') {
    
                                const parent = target.closest('.reon_widget_settings-access-filter')
                                const oldActive = parent.querySelector('.reon_widget_settings-access-filter-list-item-active')
                                const name = target.getAttribute('name');
                                const search = place.querySelector('.reon_widget_ai_list-search-input');
                                search.value = '';
                                oldActive.classList.remove('reon_widget_settings-access-filter-list-item-active')
                                target.classList.add('reon_widget_settings-access-filter-list-item-active')
                                filterCurrent.textContent = target.textContent
                                filterList.style.display = 'none';
    
                                const currentFilter = filters.find(filter => filter.type === type);
                                if (name === 'all') {
                                    currentFilter.value = name
                                } else {
                                    currentFilter.value = name === 'true' ? true : false;
                                }
                                const filteredUsers = filterAccessBlock(filters, accUsers);
                                renderFilteredUsers(filteredUsers, self)
                            }
                            if (type === 'group') {
                                const parent = target.closest('.reon_widget_settings-access-filter')
                                const oldActive = parent.querySelector('.reon_widget_settings-access-filter-list-item-active')
                                const name = target.getAttribute('name');
                                const search = place.querySelector('.reon_widget_ai_list-search-input');
                                search.value = '';
                                oldActive.classList.remove('reon_widget_settings-access-filter-list-item-active')
                                target.classList.add('reon_widget_settings-access-filter-list-item-active')
                                filterCurrent.textContent = target.textContent
                                filterList.style.display = 'none';
    
                                const currentFilter = filters.find(filter => filter.type === type);
                                currentFilter.value = name;
                                const filteredUsers = filterAccessBlock(filters, accUsers);
                                renderFilteredUsers(filteredUsers, self)
                            }
                        }
    
                        if (e.target.classList.contains('reon_widget_settings-access-filter-list-item')) {
                            actionOnFilterClick(e.target, type, self)
                        } else {
                            const target = e.target.querySelector('.reon_widget_settings-access-filter-list-item')
                            actionOnFilterClick(target, type, self)
                        }
                    })
                }
                initializeFilter('checked', accUsers, filters, self);
                initializeFilter('group', accUsers, filters, self)
            }
            await renderAccessUsersBlock(accUsers)
    
            const actionOnGeneralCheckbox = (filters, accUsers) => {
                const generalCheckbox = place.querySelector('.reon_widget_settings-access-checkbox-all');
                const checkboxAllObserver = new MutationObserver(() => {
                    const allCheckboxes = place.querySelector('.reon_widget_settings-access').querySelectorAll('.reon_widget_settings-access-row:not(.reon_widget_settings-access-heading)')
                    if (generalCheckbox.classList.contains('is-checked')) {
                        allCheckboxes.forEach(checkbox => {
                            const input = checkbox.querySelector('input[type="checkbox"]');
                            const label = checkbox.querySelector('label.control-checkbox');
                            input.checked = true;
                            label.classList.add('is-checked');
                            const filteredUsers = filterAccessBlock(filters, accUsers);
                            filteredUsers.forEach(user => {
                                user.checked = true;
                            })
                        })
                    } else {
                        allCheckboxes.forEach(checkbox => {
                            const input = checkbox.querySelector('input[type="checkbox"]');
                            const label = checkbox.querySelector('label.control-checkbox');
                            input.checked = false;
                            label.classList.remove('is-checked');
                            const filteredUsers = filterAccessBlock(filters, accUsers);
                            filteredUsers.forEach(user => {
                                user.checked = false;
                            })
                        })
                    }
                })
                checkboxAllObserver.observe(generalCheckbox, {
                    attributes: ['class']
                })
            }
            actionOnGeneralCheckbox(filters, accUsers)
    
            const actionOnSearchInput = (accUsers, filters, self) => {
                const search = place.querySelector('.reon_widget_ai_list-search-input');
                search.addEventListener('input', e => {
                    clearFilters(place.querySelector('[filter-type="group"]'), filters)
                    clearFilters(place.querySelector('[filter-type="checked"]'), filters)
                    const filteredSearch = accUsers.filter(user => user.title.toLowerCase().includes(e.target.value.toLowerCase()));
                    renderFilteredUsers(filteredSearch, self);
                })
            }
            actionOnSearchInput(accUsers, filters, self);
    
            const actionOnSettingsSaveButton = () => {
                document.querySelector('.js-widget-save').addEventListener('mousedown', () => {
                    const accessUsersArray = {}
                    accUsers.forEach(user => {
                        if (user.checked) {
                            accessUsersArray[user.id] = user.id;
                        }
                    })
                    const settingInput = document.querySelector('[name="access_for_users"]')
                    settingInput.value = JSON.stringify(accessUsersArray)
                })
            }
            actionOnSettingsSaveButton()
        }
        this.insertPriceBlock = (place, position = 'beforeend', settings) => {
            class createPriceBlock {
                constructor() {
                    this.$el = `<div class="reon_widget_settings-price">`
                    this.$prices = `<div class="reon_widget_settings-price-body">`
                }
    
                addPriceItem(setting) {
                    this.$prices += (`
                    <div class="reon_widget_settings-price-item ${setting.active ? 'reon_widget_settings-price-item-active' : ''}">
                        <div class="reon_widget_settings-price-item-title">
                            ${setting.title}
                        </div>
                        <div class="reon_widget_settings-price-item-body">
                            <span class="reon_widget_settings-price-period">${setting.period}</span>
                            <span class="reon_widget_settings-price-value">${setting.value}</span>
                        </div>
                    </div>`)
                }
                closePriceBlock() {
                    return this.$el + this.$prices + '</div>' + `<a href="https://reon.pro/marketplace#oplata_vidgeta" target="_blank">${createTwigButton({
                        class_name: 'reon_widget_settings-price-btn',
                        name: 'reon-btn-payment',
                        text: 'Оплатить онлайн',
                        id: 'reon-btn-payment',
                        blue: true
                    })}</a></div>`
                }
            }
            const actionPriceBlock = (target) => {
                if (!target.classList.contains('reon_widget_settings-price-item-active')) {
                    const priceBody = target.closest('.reon_widget_settings-price-body');
                    const oldActive = priceBody.querySelector('.reon_widget_settings-price-item-active');
                    oldActive.classList.remove('reon_widget_settings-price-item-active')
                    target.classList.add('reon_widget_settings-price-item-active')
                }
            }
    
            const priceBlockTemplate = new createPriceBlock();
            settings.forEach(setting => {
                priceBlockTemplate.addPriceItem(setting)
            })
    
            place.insertAdjacentHTML(position, priceBlockTemplate.closePriceBlock())
    
            const priceBlock = place.querySelector('.reon_widget_settings-price-body')
            priceBlock.addEventListener('click', (e) => {
                if (e.target.classList.contains('reon_widget_settings-price-item')) {
                    actionPriceBlock(e.target)
                } if (e.target.closest('.reon_widget_settings-price-item')) {
                    const target = e.target.closest('.reon_widget_settings-price-item')
                    actionPriceBlock(target)
                }
            })
        }
    }
    return settingREONConstructor
});