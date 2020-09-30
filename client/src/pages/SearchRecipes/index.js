// DEPENDENCIES
import React, { useState, useEffect } from "react";
import {
  Jumbotron,
  Container,
  Col,
  Form,
  Button,
  Card,
  CardColumns,
} from "react-bootstrap";
import Auth from "../../utils/auth";
//this api will need to be adjusted for what ever we end up using
import { searchApiRecipes } from "../../utils/API";
import { saveRecipeIds, getSavedRecipeIds } from "../../utils/localStorage";
import { useMutation } from "@apollo/react-hooks";
import { SAVE_RECIPE } from "../../utils/mutations";
// SEARCH BOOKS
const SearchRecipes = () => {
  const [saveRecipe, { error }] = useMutation(SAVE_RECIPE);
  // create state for holding returned google api data
  const [searchedRecipes, setSearchedRecipes] = useState([]);
  // create state for holding our search field data
  const [searchInput, setSearchInput] = useState("");
  // create state to hold saved recipeId values
  const [savedRecipeIds, setSavedRecipeIds] = useState(getSavedRecipeIds());
  // set up useEffect hook to save `savedRecipeIds` list to localStorage on component unmount
  // learn more here: https://reactjs.org/docs/hooks-effect.html#effects-with-cleanup
  useEffect(() => {
    return () => saveRecipeIds(savedRecipeIds);
  });
  // create method to search for recipes and set state on form submit
  const handleFormSubmit = async (event) => {
    event.preventDefault();
    if (!searchInput) {
      return false;
    }
    try {
      const response = await searchApiRecipes(searchInput);
      if (!response.ok) {
        throw new Error("something went wrong!");
      }
      const { items } = await response.json();
      const recipeData = items.map((recipe) => ({
        recipeId: recipe.id,
        title: recipe.volumeInfo.title,
        ingredients: recipe.volumeInfo.ingredients || ["No ingredients to display"],
        directions: recipe.volumeInfo.directions,
        image: recipe.volumeInfo.imageLinks?.thumbnail || "",
        link: recipe.volumeInfo.previewLink
      }));
      setSearchedRecipes(recipeData);
      setSearchInput("");
    } catch (err) {
      console.error(err);
    }
  };
  // create function to handle saving a recipe to our database
  const handleSaveRecipe = async (recipeId) => {
    // find the recipe in `searchedRecipes` state by the matching id
    const recipeToSave = searchedRecipes.find(
      (recipe) => recipe.recipeId === recipeId
    );
    // get token
    const token = Auth.loggedIn() ? Auth.getToken() : null;
    if (!token) {
      return false;
    }
    try {
      const { data } = await saveRecipe({
        variables: {
          input: recipeToSave,
        }
      });
      // if recipe successfully saves to user's account, save recipe id to state
      setSavedRecipeIds([...savedRecipeIds, recipeToSave.recipeId]);
    } catch (err) {
      console.error(err);
    }
  };
  return (
    <>
      <Jumbotron fluid className="text-light bg-dark">
        <Container>
          <h1>Search for Recipes!</h1>
          <Form onSubmit={handleFormSubmit}>
            <Form.Row>
              <Col xs={12} md={8}>
                <Form.Control
                  name="searchInput"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  type="text"
                  size="lg"
                  placeholder="Search for a recipe"
                />
              </Col>
              <Col xs={12} md={4}>
                <Button type="submit" variant="success" size="lg">
                  Submit Search
                </Button>
              </Col>
            </Form.Row>
          </Form>
        </Container>
      </Jumbotron>
      <Container>
        <h2>
          {searchedRecipes.length
            ? `Viewing ${searchedRecipes.length} results:`
            : "Search for a recipe to begin"}
        </h2>
        <CardColumns>
          {searchedRecipes.map((recipe) => {
            return (
              <Card key={recipe.recipeId} border="dark">
                {recipe.image ? (
                  <Card.Img
                    src={recipe.image}
                    alt={`The cover for ${recipe.title}`}
                    variant="top"
                  />
                ) : null}
                <Card.Body>
                  <Card.Title>{recipe.title}</Card.Title>
                  <p className="small">Ingredients: {recipe.ingredients}</p>
                  <Card.Text>{recipe.directions}</Card.Text>
                  {Auth.loggedIn() && (
                    <Button
                      disabled={savedRecipeIds?.some(
                        (savedRecipeId) => savedRecipeId === recipe.recipeId
                      )}
                      className="btn-block btn-info"
                      onClick={() => handleSaveRecipe(recipe.recipeId)}
                    >
                      {savedRecipeIds?.some(
                        (savedRecipeId) => savedRecipeId === recipe.recipeId
                      )
                        ? "This recipe has already been saved!"
                        : "Save this Recipe!"}
                    </Button>
                  )}
                </Card.Body>
              </Card>
            );
          })}
        </CardColumns>
      </Container>
    </>
  );
};
// EXPORTS
export default SearchRecipes;
