import "./ResponsiveAppBar.css"

function ResponsiveAppBar() {
  return ( 
     <header class="d-flex flex-wrap align-items-center justify-content-center justify-content-md-between py-3 mb-4 border-bottom"> <div class="col-md-3 mb-2 mb-md-0"> <a href="/" class="d-inline-flex link-body-emphasis text-decoration-none"> <svg class="bi" width="40" height="32" role="img" aria-label="Bootstrap"><use xlink:href="#bootstrap"></use></svg> </a> </div> <ul class="nav col-12 col-md-auto mb-2 justify-content-center mb-md-0"> <li><a href="#" class="nav-link px-2 link-secondary text-black fs-5 fw-bold">Home</a></li> <li><a href="http://localhost:5173/analyze-mood" class="nav-link px-2 text-black fs-5 fw-bold">AnalyzeMood</a></li> <li><a href="http://localhost:5173/therapistconnect" class="nav-link px-2 text-black fs-5 fw-bold">TherapistConnect</a></li> <li><a href="http://localhost:5173/recommendation" class="nav-link px-2 text-black fs-5 fw-bold">Reccommendation</a></li> <li><a href="#" class="nav-link px-2 text-black fs-5 fw-bold">Dashboard</a></li><li><a href="#" class="nav-link px-2 text-black fs-5 fw-bold">About</a></li> </ul> <div class="col-md-3 text-end"> <button type="button" class="btn btn-outline-primary me-2">Login</button> <button type="button" class="btn btn-primary m-2">Sign-up</button> </div> </header>
   );
}

export default ResponsiveAppBar;