//make sure to delete this before deploying

const AUTH_COOKIE = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwibmFtZSI6IlwidGVzdHkgbWN0ZXN0ZmFjZVwiIiwiYWRtaW4iOmZhbHNlLCJleHAiOjE2ODQyMjQyMzh9.Ka6AjBzjRzzmsOGQvq4bYfjTm9N8o0Sgp805sgqsqUk"

const SEARCH_BY_TEXT_BASE_URL = "https://api-test.gojellyfish.link/lab/ingredient/search-by-text/";

const SEARCH_BY_ID_BASE_URL = "https://api-test.gojellyfish.link/lab/ingredient/search-by-id/"

const LOGIN_TYPE = "1";


// selectors

const addIngredientInput = document.querySelector('#form__ingredient-add');
const ingredientsAddListArea = document.querySelector('#ingredients-list__item-add-area');

const loginEmail = document.querySelector('#calculator__form-login-email');
const loginPassword = document.querySelector('#calculator__form-login-password');
const loginForm = document.querySelector('#calculator__form-login');
const loginError = document.querySelector('#calculator__login-error');

const signupForm = document.querySelector('#calculator__form-signup');
const signupError = document.querySelector('#calculator__signup-error');

const addIngredientForm = document.querySelector('#calculator__form_add');

const ingredientList = document.querySelector('#calculator__ingredients-list');
const ingredientsResetButton = document.querySelector('#calculator__ingredients-area-reset');

let editButtons;

let fetchTimeoutID;


//event listeners
addIngredientInput.addEventListener('input', onType);
loginForm.addEventListener('submit', login);
signupForm.addEventListener('submit', signup);
addIngredientForm.addEventListener('submit', addIngredientToRecipe);
ingredientsResetButton.addEventListener('click', resetIngredientsList);






//functions


// refactor to async functions / try catch blocks

// do something about check if an igredient has alerady been added

// on hover for edit and delete

// change localstarage to object - this will let you check for duplicates, edit and delete more easily. You can also hold the servings best/worst perservings and other info there

// basic set up {ingredients: (use a map!!!!){id: {}}, servings: 1, best: id, worst: id}

(function(){
    let token = localStorage.getItem('gojellytoken');
    console.log('localstorage',localStorage);
    if (token) {
        document.querySelector('#calculator__dialog').close();
        buildIngredientsList();
    }
})()


// DO SOME GD ERROR HANDLING

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
        let res = await fetch("https://api-test.gojellyfish.link/app/auth/login", requestOptions)
        let result = await res.json();
        localStorage.setItem('gojellytoken', result.data.access_token);
        loginForm.reset();
        document.querySelector('#calculator__dialog').close()
    } catch (error) {
        loginForm.reset()
        loginError.innerText = error.message;
    }

    // fetch("https://api-test.gojellyfish.link/app/auth/login", requestOptions)
    // .then(response => response.json())
    // .then(result => {
    //     localStorage.setItem('gojellytoken', result.data.access_token);
    //     loginForm.reset();
    //     document.querySelector('#calculator__dialog').close()
    // })
    // .catch(error => console.log('error', error));

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
        let res = await fetch("https://api-test.gojellyfish.link/app/auth/signup", requestOptions)
        let result = await res.json();
        localStorage.setItem('gojellytoken', result.data.access_token);
        signupForm.reset();
        document.querySelector('#calculator__dialog').close()
    } catch (error) {
        signupForm.reset()
        signupError.innerText = error.message;
    }

    // fetch("https://api-test.gojellyfish.link/app/auth/signup",requestOptions)
    // .then(response => response.json())
    // .then(result => {
    //     localStorage.setItem('gojellytoken', result.data.access_token);
    //     signupForm.reset();
    //     document.querySelector('#calculator__dialog').close()
    // })
    // .catch(error => console.log('error', error));

}

//refactor to work for either add or edit
function onType(){
    if (addIngredientInput.value.length === 0) {
        clearSuggestions();
        return
    }

    clearTimeout(fetchTimeoutID);
    fetchTimeoutID = setTimeout(fetchAndAddIngredients, 500);
}


function clearSuggestions() {
    clearTimeout(fetchTimeoutID);
    // do i need this?
    ingredientsAddListArea.innerHTML = '';
}

// fetch - add to add section

async function fetchAndAddIngredients() {
    let ingredientsArr = await fetchIngredients();
    let trimmedIngredients = ingredientsArr.slice(0,6);
    console.log(trimmedIngredients);
    ingredientsAddListArea.innerHTML = '';
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
        ingredientsAddListArea.appendChild(ingredientRadio);
        ingredientsAddListArea.appendChild(ingredientRadioLabel);
    })
}

// fetch - add to edit section
async function fetchAndEditIngredient(){

}


async function fetchIngredients() {
    let token = localStorage.getItem('gojellytoken')
    let ingredientFetchHeader = new Headers();
    ingredientFetchHeader.append('Authorization', `Bearer ${token}`);

    let ingredientFetchOptions = {
        method: 'GET',
        headers: ingredientFetchHeader,
        redirect: 'follow'
    };

    let ingredientFetchUrl = new URL(SEARCH_BY_TEXT_BASE_URL);
    ingredientFetchUrl.searchParams.set('search_text', addIngredientInput.value);

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

    // const response = await fetch(ingredientFetchUrl, ingredientFetchOptions);
    // const data = await response.json();
    // console.log('data', data);
    // return data.data;
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
    deleteBtn.classList.add("fas", "fa-trash", 'calculator__ingredients-list-item-edit-btn');

    ingredientInfo.append(ingredientName, ingredientAmount, ingredientUnit)
    ingredientContainer.append(ingredientInfo, ingredientGco2e);
    btnContainer.append(editBtn, deleteBtn);
    ingredientLi.append(ingredientContainer, btnContainer)
    
    return ingredientLi;

}

function doIngredientsListItemMath() {
    // use convertUnits to convert slected unit to grams

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
    let { name, unit, amount } = item;
    let editForm = document.createElement('form');
    
    let editIngredientName = document.createElement('input');
    let editIngredientUnit = document.createElement('select');
    let editIngredientAmount = document.createElement('input');

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

    editIngredientUnit.id = "form_ingredient-edit-unit";
    editIngredientUnit.required = true;

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

}

function deleteIngredientsListItem() {

}

function resetIngredientsList() {
    ingredientList.innerHTML = "";
    localStorage.setItem('gojellyrecipeingredients', JSON.stringify([]));
}

function doIngredientsListMath() {

}