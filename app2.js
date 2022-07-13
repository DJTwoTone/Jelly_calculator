// Constants

const LOGIN_URL = "https://api-test.gojellyfish.link/app/auth/login";
const SIGNUP_URL = "https://api-test.gojellyfish.link/app/auth/signup";
const SEARCH_BY_TEXT_BASE_URL = "https://api-test.gojellyfish.link/lab/ingredient/search-by-text/";
const SEARCH_BY_ID_BASE_URL = "https://api-test.gojellyfish.link/lab/ingredient/search-by-id/"
const LOGIN_TYPE = "1";

let fetchTimeoutID;
let fetchTimeoutIDForAdd;
let fetchTimeoutIDForEdit;

// Selectors

const loginSignupDialog = document.getElementById('calculator__dialog');

const loginForm = document.querySelector('#calculator__form-login');
const loginError = document.querySelector('#calculator__login-error');

const signupForm = document.querySelector('#calculator__form-signup');
const signupError = document.querySelector('#calculator__signup-error');

const addIngredientInput = document.querySelector('#form__ingredient-add');

const addIngredientArea = document.querySelector('#ingredients-list__item-add-area');
const ingredientsAddListArea = document.querySelector('#ingredients-list__item-add-area');
const ingredientList = document.querySelector('#calculator__ingredients-list');



const addIngredientForm = document.querySelector('#calculator__form_add');

const ingredientsResetButton = document.querySelector('#calculator__ingredients-area-reset');




// Event Listeners
loginForm.addEventListener('submit', login);
signupForm.addEventListener('submit', signup);

addIngredientInput.addEventListener('input', searchIngredientOnType);

addIngredientForm.addEventListener('submit', addIngredientToRecipe);

ingredientsResetButton.addEventListener('click', resetIngredientsList);


// Functions

// On load, check for a user token in the local storage. If it's there, close the login/signup dialog
(function(){
    // loginSignupDialog.show();
    let token = localStorage.getItem('gojellytoken');
    console.log('localstorage', localStorage, 'token', token);
    if (token) {
        loginSignupDialog.close();
        buildIngredientsList();
    }
})()


async function login (evt) {
    evt.preventDefault();
    let email = evt.target[0].value;
    let password = evt.target[1].value;

    let formdata = new FormData();
    
    formdata.append("email", email);
    formdata.append("password", password);

    let requestOptions = {
    method: 'POST',
    body: formdata,
    redirect: 'follow'
    };

    try {
        let res = await fetch(LOGIN_URL, requestOptions);
        console.log('res', res)
        let result = await res.json();
        console.log('result', result)
        localStorage.setItem('gojellytoken', result.data.access_token);
        loginForm.reset();
        document.querySelector('#calculator__dialog').close()
    } catch (error) {
        loginForm.reset()
        loginError.innerText = error.message;
    }
}

async function signup (evt) {
    evt.preventDefault();
    let name = evt.target[0].value;
    let email = evt.target[1].value;
    let password = evt.target[2].value;
    let passwordConfirm = evt.target[3].value;

    let formdata = new FormData();
    formdata.append("login_type", LOGIN_TYPE);
    formdata.append("password", password);
    formdata.append("name", name);
    formdata.append("email", email);

    let requestOptions = {
    method: 'POST',
    body: formdata,
    redirect: 'follow'
    };

    try {
        if (password !== passwordConfirm) {
            throw new Error('Passwords do not match');
        }
        let res = await fetch(SIGNUP_URL, requestOptions)
        let result = await res.json();
        localStorage.setItem('gojellytoken', result.data.access_token);
        signupForm.reset();
        document.querySelector('#calculator__dialog').close()
    } catch (error) {
        signupForm.reset()
        signupError.innerText = error.message;
    }
}

function searchIngredientOnType() {
    if (addIngredientInput.value.length === 0) {
        clearSuggestions(addIngredientArea, fetchTimeoutIDForAdd);
        addIngredientArea.innerHTML = "";
        return;
    }

    clearTimeout(fetchTimeoutIDForAdd);
    fetchTimeoutIDForAdd = setTimeout(fetchIngredientsAndDisplay(addIngredientArea, addIngredientInput), 500)
}


function clearSuggestions(area, timeout) {
    clearTimeout(timeout);
    area.innerHTML = "";
}

async function fetchIngredientsAndDisplay(displayArea, input) {
    let ingredientsArr = await fetchIngredients(input.value);
    let trimmedIngredients = ingredientsArr.slice(0,6);
    console.log(trimmedIngredients);
    displayArea.innerHTML = '';
    trimmedIngredients.forEach(ingredient => {
        let ingredientRadio = document.createElement('input');
        ingredientRadio.setAttribute('type', 'radio');
        ingredientRadio.setAttribute('name', 'ingredientId');
        ingredientRadio.setAttribute('value', ingredient.id);
        ingredientRadio.setAttribute('id', `ingredient-radio-${ingredient.id}`);
        ingredientRadio.classList.add('ingredients-list__item');
        ingredientRadio.innerHTML = `${ingredient.name}`;
        let ingredientRadioLabel = document.createElement('label');
        ingredientRadioLabel.setAttribute('for', `ingredient-radio-${ingredient.id}`);
        ingredientRadioLabel.innerText = `${ingredient.name}`;
        // ingredientItem.addEventListener('click', onIngredientClick);
        displayArea.appendChild(ingredientRadio);
        displayArea.appendChild(ingredientRadioLabel);
    })
}

async function fetchIngredients(input) {
    let token = localStorage.getItem('gojellytoken')
    let ingredientFetchHeader = new Headers();
    ingredientFetchHeader.append('Authorization', `Bearer ${token}`);

    let ingredientFetchOptions = {
        method: 'GET',
        headers: ingredientFetchHeader,
        redirect: 'follow'
    };

    let ingredientFetchUrl = new URL(SEARCH_BY_TEXT_BASE_URL);
    ingredientFetchUrl.searchParams.set('search_text', input);

    try {
        let res = await fetch(ingredientFetchUrl, ingredientFetchOptions);
        let result = await res.json();
        return result.data;
    } catch (error) {
        console.log(error);
    }
    // const response = await fetch(ingredientFetchUrl, ingredientFetchOptions);
    // const data = await response.json();
    // return data.data;
}

async function fetchIngredientById(id) {
    let token = localStorage.getItem('gojellytoken')
    let ingredientFetchHeader = new Headers();
    ingredientFetchHeader.append('Authorization', `Bearer ${token}`);

    let ingredientFetchOptions = {
        method: 'GET',
        headers: ingredientFetchHeader,
        redirect: 'follow'
    };

    let ingredientFetchUrl = new URL(SEARCH_BY_ID_BASE_URL);
    ingredientFetchUrl.searchParams.set('id', id);

    try {
        let res = await fetch(ingredientFetchUrl, ingredientFetchOptions);
        let result = await res.json();
        return result.data;
    } catch (error) {
        console.log(error);
    }

}

async function addIngredientToRecipe(evt) {
    evt.preventDefault();
    if (localStorage.getItem('gojellyrecipeingredients') === null) {
        localStorage.setItem("gojellyrecipeingredients", JSON.stringify([]))
    }
    const {ingredientId, unit, amount } = Object.fromEntries(new FormData(addIngredientForm).entries());
    console.log({ingredientId, unit, amount })
    
    // let testRes = await fetchIngredientById(ingredientId);
    let { name, gco2e } = await fetchIngredientById(ingredientId);
    // console.log('testRes', testRes);
    console.log({ingredientId, name, gco2e, unit, amount });

    let localStorageIngredients = JSON.parse(localStorage.getItem('gojellyrecipeingredients'));
    localStorageIngredients.push({ingredientId, name, gco2e, unit, amount })
    localStorage.setItem('gojellyrecipeingredients', JSON.stringify(localStorageIngredients));
    addIngredientForm.reset()
    ingredientsAddListArea.innerHTML = '';
    ingredientList.innerHTML = "";
    buildIngredientsList();

    
}

function buildIngredientsList() {
    let listFragment = document.createDocumentFragment();
    // get list from local storage
    const ingredientListFromLocalStorage = JSON.parse(localStorage.getItem('gojellyrecipeingredients'));
    // iterate over list to build items
    for (item of ingredientListFromLocalStorage) {
        let itemToAdd = buildIngredientsListItem(item);
        listFragment.appendChild(itemToAdd);
    }
    // append items to list
    ingredientList.appendChild(listFragment);
    editButtons = document.querySelectorAll('.calculator__ingredients-list-item-edit-btn');
    editButtons.forEach(button => {
        button.addEventListener('click', editIngredientsListItem);
    })
    deleteButtons = document.querySelectorAll('.calculator__ingredients-list-item-delete-btn');
    deleteButtons.forEach(button => {
        button.addEventListener('click', deleteIngredientsListItem);
    })
    // highlight best and worst
    // show highlight key
}

function buildIngredientsListItem(item) {
    let { ingredientId, name, gco2e, unit, amount } = item;
    let ingredientLi = document.createElement('li');
    ingredientLi.classList.add('ingredients-list__item');
    ingredientLi.setAttribute('data-id', ingredientId);

    let ingredientContainer = document.createElement('div');
    let ingredientInfo = document.createElement('span');


    let ingredientName = document.createElement('p');
    let ingredientGco2e = document.createElement('p');
    let ingredientAmount = document.createElement('p');
    let ingredientUnit = document.createElement('p');
    
    let btnContainer = document.createElement('span');

    let editBtn = document.createElement('i');
    let deleteBtn = document.createElement('i');

    ingredientName.innerText = name;
    ingredientGco2e.innerText = `${gco2e} gCO2e`;
    ingredientAmount.innerText = `${amount}`;
    ingredientUnit.innerText = `${unit}`;

    ingredientContainer.classList.add('ingredient-container');
    btnContainer.classList.add('btn-container');
    
    ingredientAmount.classList.add("ingredient-amount");
    ingredientUnit.classList.add("ingredient-unit");
    ingredientName.classList.add("ingredient-name");
    
    editBtn.classList.add("far", "fa-edit", 'calculator__ingredients-list-item-edit-btn');
    deleteBtn.classList.add("fas", "fa-trash", 'calculator__ingredients-list-item-delete-btn');

    ingredientInfo.append(ingredientName, ingredientAmount, ingredientUnit)
    ingredientContainer.append(ingredientInfo, ingredientGco2e);
    btnContainer.append(editBtn, deleteBtn);
    ingredientLi.append(ingredientContainer, btnContainer)
    
    return ingredientLi;

}

function resetIngredientsList() {
    ingredientList.innerHTML = "";
    localStorage.setItem('gojellyrecipeingredients', JSON.stringify([]));
    
}

function editIngredientsListItem(evt) {

    const unitOptionList = {
        mg: "milligram - mg",
        g: "gram - g",
        kg: "kilogram - kg",
        oz: "ounce - oz",
        lb: "pound - lb",
        ml: "milliliter - ml",
        l: "liter - l",
        tsp: "teaspoon - tsp",
        tbs: "tablespoon - tbs",
        'fl-oz': "fluid-ounce - fl-oz",
        cup: "cup - cup",
        pnt: "pint - pnt",
        qt: "quart - qt",
        gal:"gallon - gal",
    }

    
    let itemContainer = evt.target.parentNode.parentNode;
    let id = evt.target.parentNode.parentNode.dataset.id;
    let localStorageIngredients = JSON.parse(localStorage.getItem('gojellyrecipeingredients'));
    let item = localStorageIngredients.find(item => item.ingredientId === id);
    let index = localStorageIngredients.indexOf(item);
    let { name, unit, amount, ingredientId } = item;
    let editForm = document.createElement('form');
    
    let editIngredientName = document.createElement('input');
    let editIngredientUnit = document.createElement('select');
    let editIngredientAmount = document.createElement('input');

    let ingredientArea = document.createElement('div');

    let editIngredientNameLabel = document.createElement('label');
    let editIngredientUnitLabel = document.createElement('label');
    let editIngredientAmountLabel = document.createElement('label');

    let submitEditBtn = document.createElement('button');

    editIngredientName.type = 'text';
    editIngredientUnit.type = 'select';
    editIngredientAmount.type = 'number';

    editIngredientName.id = "form_ingredient-edit-name";
    editIngredientName.setAttribute("name", "form_ingredient-edit-name");
    editIngredientName.setAttribute("placeholder", "INGREDIENT");
    editIngredientName.value = name;

    editIngredientUnit.id = "form_ingredient-edit-unit";
    // editIngredientUnit.required = true;

    ingredientArea.id = "form_ingredient-edit-area";

    let topOption = document.createElement('option');
    topOption.value = "";
    topOption.innerText = "Please choose a unit";

    let blankOption = document.createElement('option');
    blankOption.disabled = true;

    editIngredientUnit.append(topOption, blankOption);

    for (let unit in unitOptionList) {
        let option = document.createElement('option');
        option.value = unit;
        option.innerText = unitOptionList[unit];
        editIngredientUnit.append(option);
    }

    editIngredientUnit.value = unit;

    editIngredientAmount.id = "form_ingredient-edit-amount";
    editIngredientAmount.setAttribute("name", "form_ingredient-edit-amount");
    editIngredientAmount.value = amount;
    editIngredientAmount.required = true;

    editIngredientNameLabel.innerText = "Search Ingredient:";
    editIngredientNameLabel.setAttribute("for", "form_ingredient-edit-name");

    editIngredientUnitLabel.innerText = "Units:";
    editIngredientUnitLabel.setAttribute("for", "form_ingredient-edit-unit");

    editIngredientAmountLabel.innerText = "Amount:";
    editIngredientAmountLabel.setAttribute("for", "form_ingredient-edit-amount");

    submitEditBtn.innerText = "Edit";

    editForm.append(editIngredientNameLabel, editIngredientName, ingredientArea, editIngredientUnitLabel, editIngredientUnit, editIngredientAmountLabel, editIngredientAmount, submitEditBtn);
    itemContainer.innerHTML = "";
    itemContainer.append(editForm);

    fetchIngredientsAndDisplay(ingredientArea, editIngredientName)

    function editIngredientOnType() {
        if (editIngredientName.value.length === 0) {
            clearSuggestions(ingredientArea, fetchTimeoutIDForAdd);
            ingredientArea.innerHTML = "";
            return;
        }
    
        clearTimeout(fetchTimeoutIDForAdd);
        fetchTimeoutIDForAdd = setTimeout(fetchIngredientsAndDisplay(ingredientArea, editIngredientName), 500)
    }

    editIngredientName.addEventListener('input', editIngredientOnType)

    submitEditBtn.addEventListener('click', async function(evt) {
        evt.preventDefault();

        console.log("for check",  Object.fromEntries(new FormData(editForm).entries()))

        const {ingredientId, unit, amount } = Object.fromEntries(new FormData(editForm).entries());

        let { name, gco2e } = await fetchIngredientById(ingredientId);

        let newItem = {
            // ingredientId,
            name,
            unit,
            amount,
            gco2e
        }

        console.log(newItem)

        localStorageIngredients.splice(index, 1, newItem);
        localStorage.setItem('gojellyrecipeingredients', JSON.stringify(localStorageIngredients));

        ingredientList.innerHTML = '';
        buildIngredientsList();
    })

}

function deleteIngredientsListItem(evt) {
    let id = evt.target.parentNode.parentNode.dataset.id;
    let localStorageIngredients = JSON.parse(localStorage.getItem('gojellyrecipeingredients'));
    console.log(evt.target.parentNode.parentNode.dataset.id)
    let newIngredients = localStorageIngredients.filter(item => item.ingredientId !== id);
    localStorage.setItem('gojellyrecipeingredients', JSON.stringify(newIngredients));
    ingredientList.innerHTML = "";
    buildIngredientsList();


}

// typing into the edit ingrdient form

// clear the search form and the area of suggestions

// fetch ingrdients list from api

// format the ingredient list

// add the the appropriate area

// fetch ingredient by id

// format data with units and amount and gco2e and id and name

// add to local storage

// get ingredieants from local storage

// format for recipe area

// check number of servings

// divide for per serving

// give totals for each

// delete ingredient from recipe

// edit ingredient in recipe

// get info from local storage

// build form

// put values in form

// do a search for the value in name

// add searched autocompletes

// add those to the editng form

// we need a listener for typing in this

// update the ingredient

// resave to local storage

// listener for resetting the recipe



