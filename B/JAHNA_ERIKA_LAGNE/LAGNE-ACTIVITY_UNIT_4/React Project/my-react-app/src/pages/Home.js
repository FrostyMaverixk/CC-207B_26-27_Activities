import LandingLayout from "../layouts/LandingLayout";
function Home(){
    return(
        <>
        <LandingLayout>
            <div className = "home-content">
                <h4>Home Page</h4>
                <h1>Pink is not just a color; it's a state of mind</h1>
                <p>I LOVE PINK!!</p>
            </div>
       </LandingLayout>
       </>
    );
}

export default Home;