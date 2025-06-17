$(document).ready(function () {
  let currentPage = 1;
  let totalPages = 1;
  let careerDetails = {};

  // API Configuration
  const CAREER_LIST_ENDPOINT =
    "https://www.ehlcrm.theskyroute.com/api/test/top-future-career";
  const CAREER_DETAILS_ENDPOINT =
    "https://www.ehlcrm.theskyroute.com/api/future-career-details";

  // Department mapping
  const DEPARTMENT_NAMES = {
    1: "Business & Finance",
    4: "Architecture & Design",
    7: "Marketing & Communications",
    9: "Engineering & Technology",
    11: "Medicine & Healthcare",
    13: "Research & Academia",
    14: "Computer Science & Data",
    16: "Law & Legal Studies",
  };

  // Initialize the application
  init();

  function init() {
    // Check if we're on a details page
    const urlParams = new URLSearchParams(window.location.search);
    const careerId = urlParams.get("id");

    if (careerId) {
      // Hide everything except navbar when showing details
      $(".hero-section, .stats-section, .pagination-container").hide();
      loadAndShowCareerDetails(careerId);
    } else {
      // Show all sections when on main page
      $(".hero-section, .stats-section, .pagination-container").show();
      loadCareers(currentPage);
    }

    setupEventListeners();
  }

  function setupEventListeners() {
    // Home link click
    $("#homeLink").on("click", function (e) {
      e.preventDefault();
      // Clear URL parameters and reload main page
      window.history.replaceState({}, document.title, window.location.pathname);
      currentPage = 1;
      $(".hero-section, .stats-section, .pagination-container").show();
      loadCareers(currentPage);
    });

    // Pagination click events (delegated)
    $(document).on("click", ".pagination .page-link", function (e) {
      e.preventDefault();
      const page = $(this).data("page");
      if (page && page !== currentPage) {
        currentPage = page;
        loadCareers(currentPage);
        scrollToTop();
      }
    });

    // View details button click (delegated)
    $(document).on("click", ".view-details-btn", function () {
      const careerId = $(this).data("career-id");
      viewCareerDetails(careerId);
    });

    // Back button for career details
    $(document).on("click", "#backToList", function () {
      window.history.replaceState({}, document.title, window.location.pathname);
      $(".hero-section, .stats-section, .pagination-container").show();
      loadCareers(currentPage);
    });

    // Load career details on hover
    $(document).on("mouseenter", ".career-card", function () {
      const careerId = $(this).data("career-id");
      if (careerId && !careerDetails[careerId]) {
        loadCareerDetails(careerId, $(this));
      }
    });
  }

  function loadCareers(page = 1) {
    showLoading();

    $.ajax({
      url: `${CAREER_LIST_ENDPOINT}?page=${page}`,
      method: "GET",
      timeout: 10000,
      success: function (response) {
        if (response && response.rows && response.rows.data) {
          renderCareers(response.rows.data);
          updatePagination(response.rows);
          updateStats(response);
          currentPage = page;
        } else {
          showError("Invalid response format received from server.");
        }
        hideLoading();
      },
      error: function (xhr, status) {
        let errorMessage = "Failed to load career data. ";

        if (status === "timeout") {
          errorMessage += "Request timed out. Please check your connection.";
        } else if (xhr.status === 404) {
          errorMessage += "API endpoint not found.";
        } else if (xhr.status >= 500) {
          errorMessage += "Server error. Please try again later.";
        } else {
          errorMessage += "Please try again.";
        }

        showError(errorMessage);
        hideLoading();
      },
    });
  }

  function loadCareerDetails(careerId, cardElement) {
    $.ajax({
      url: `${CAREER_DETAILS_ENDPOINT}?id=${careerId}`,
      method: "GET",
      timeout: 5000,
      success: function (response) {
        if (response && response.data) {
          careerDetails[careerId] = response.data;
          if (cardElement) {
            updateCareerCardWithDetails(cardElement, response.data);
          }
        }
      },
      error: function (error) {
        console.error("Failed to load career details:", error);
      },
    });
  }

  function updateCareerCardWithDetails(cardElement, details) {
    const overlay = cardElement.find(".career-image-overlay");
    if (overlay.length && details.overview) {
      const truncatedOverview = truncateText(details.overview, 300);
      overlay.find(".overlay-text").text(truncatedOverview);
    }
  }

  function renderCareers(careers) {
    const container = $("#careerContainer");
    container.empty();

    if (!careers || careers.length === 0) {
      container.html(`
        <div class="col-12 text-center py-5">
          <i class="fas fa-search fa-3x text-muted mb-3"></i>
          <h3 class="text-muted">No careers found</h3>
          <p class="text-muted">Please try again or contact support.</p>
        </div>
      `);
      return;
    }

    careers.forEach((career) => {
      if (career.status === 1) {
        const careerCard = createCareerCard(career);
        container.append(careerCard);
      }
    });
  }

  const truncateText = (text, maxLength) => {
    if (text.length <= maxLength) {
      return text;
    }
    return text.slice(0, maxLength) + "...";
  };

  function createCareerCard(career) {
    const departmentName =
      DEPARTMENT_NAMES[career.course_department_id] || "General Studies";
    const isPopular = career.is_popular === 1;
    const createdDate = formatDate(career.created_at);
    const overview = career?.overview
      ? truncateText(escapeHtml(career.overview), 150)
      : "No overview available.";

    const imageStyle = career.image
      ? `background-image: url('https://www.ehlcrm.theskyroute.com${career.image}')`
      : "background: linear-gradient(45deg, #f39c12, #e67e22)";

    return `
      <div class="col-lg-3 col-md-4 col-sm-6">
        <div class="career-card" data-career-id="${career.id}">
          <div class="career-image" style="${imageStyle}">
            ${
              isPopular ? '<div class="popular-badge">Popular Career</div>' : ""
            }
            <div class="career-image-overlay">
              <div class="overlay-title">Overview</div>
              <div class="overlay-text">${overview}</div>
            </div>
          </div>
          <div class="career-content">
            <h3 class="career-title">${escapeHtml(career.name)}</h3>
            <div class="career-meta">
              <div><i class="fas fa-calendar-alt"></i> ${createdDate}</div>
            </div>
            <div class="career-meta">
              <div><i class="fas fa-check-circle text-success"></i> ${
                career?.status === 1 ? "Active" : "Inactive"
              }</div>
            </div>
            <div class="career-meta">
              <div><i class="fas fa-book text-success me-1"></i>Serial No- ${
                career?.serial_no
              }</div>
            </div>
            <div class="mb-3">
              <span class="department-tag">${escapeHtml(departmentName)}</span>
            </div>
            <button class="view-details-btn" data-career-id="${career.id}">
              View Details
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function updatePagination(paginationData) {
    const container = $("#paginationContainer");
    container.empty();

    if (!paginationData.links || paginationData.last_page <= 1) {
      return;
    }

    totalPages = paginationData.last_page;
    currentPage = paginationData.current_page;

    paginationData.links.forEach((link) => {
      let pageItem = "";

      if (link.label === "&laquo; Previous") {
        pageItem = `
          <li class="page-item ${!link.url ? "disabled" : ""}">
            <a class="page-link" href="#" data-page="${currentPage - 1}" ${
          !link.url ? 'tabindex="-1"' : ""
        }>
              <i class="fas fa-chevron-left"></i> Previous
            </a>
          </li>
        `;
      } else if (link.label === "Next &raquo;") {
        pageItem = `
          <li class="page-item ${!link.url ? "disabled" : ""}">
            <a class="page-link" href="#" data-page="${currentPage + 1}" ${
          !link.url ? 'tabindex="-1"' : ""
        }>
              Next <i class="fas fa-chevron-right"></i>
            </a>
          </li>
        `;
      } else if (!isNaN(link.label)) {
        const pageNum = parseInt(link.label);
        pageItem = `
          <li class="page-item ${link.active ? "active" : ""}">
            <a class="page-link" href="#" data-page="${pageNum}">${pageNum}</a>
          </li>
        `;
      }

      if (pageItem) {
        container.append(pageItem);
      }
    });
  }

  function updateStats(response) {
    if (response.totalCareer) {
      $("#totalSubjects").text(response.totalCareer);
    }
    $("#currentPage").text(currentPage);
    $("#totalPages").text(totalPages);
  }

  function viewCareerDetails(careerId) {
    // Update URL with career ID
    const newUrl = `${window.location.pathname}?id=${careerId}`;
    window.history.pushState({ careerId: careerId }, "", newUrl);

    // Hide other sections and show details
    $(".hero-section, .stats-section, .pagination-container").hide();
    loadAndShowCareerDetails(careerId);
  }

  function loadAndShowCareerDetails(careerId) {
    console.log("careerId: ", careerId);
    if (careerDetails[careerId]) {
      showCareerDetails(careerDetails[careerId]);
    } else {
      showLoading();
      $.ajax({
        url: `${CAREER_DETAILS_ENDPOINT}?id=${careerId}`,
        method: "GET",
        success: function (response) {
          hideLoading();
          if (response) {
            careerDetails[careerId] = response;
            showCareerDetails(response);
          } else {
            showError("Career details not found.");
          }
        },
        error: function (xhr, status) {
          hideLoading();
          let errorMessage = "Unable to load career details. ";
          if (status === "timeout") {
            errorMessage += "Request timed out.";
          } else if (xhr.status === 404) {
            errorMessage += "Career not found.";
          } else {
            errorMessage += "Please try again.";
          }
          showError(errorMessage);
        },
      });
    }
  }

  function showCareerDetails(details) {
    const container = $("#careerContainer");
    const departmentName =
      DEPARTMENT_NAMES[details.course_department_id] || "General Studies";
    const createdDate = formatDate(details.created_at);

    // Check if image exists and construct the full URL
    let imageHtml = "";
    if (details.image) {
      const imageUrl = details.image.startsWith("http")
        ? details.image
        : `https://www.ehlcrm.theskyroute.com${details.image}`;
      imageHtml = `
            <div class="text-center mb-4">
                <img src="${imageUrl}" 
                     alt="${escapeHtml(details.name)}" 
                     class="img-fluid rounded career-details-image">
            </div>
        `;
    }

    container.html(`
      <div class="col-12 mt-4">
        <div class="career-details-container">
          ${imageHtml}
          <h1 class="career-details-title">${escapeHtml(details.name)}</h1>
          <div class="career-details-meta">
            <span>Created on: ${createdDate}</span>
          </div>
          
          <div class="career-details-content">
            <p><span class="fw-bold">Overview</span> <br> ${
              details.overview
                ? escapeHtml(details.overview)
                : "No overview available."
            }</p>
            
            ${
              details.why_this
                ? `
              <p><span class="fw-bold">Why this career?</span> <br>${details.why_this}</p>
            `
                : ""
            }
             ${
               details.requirement
                 ? `
              <p><span class="fw-bold">Requirement</span> <br>${details.requirement}</p>
            `
                 : ""
             }
          </div>
          
          <div class="career-details-info">
            <div class="info-item">
              <strong>Department:</strong> ${escapeHtml(departmentName)}
            </div>
            <div class="info-item">
              <strong>Subject Status:</strong> 
              <span class="status-badge ${
                details.status === 1 ? "active" : "inactive"
              }">
                ${details.status === 1 ? "Active" : "Inactive"}
              </span>
            </div>
            <div class="info-item">
              <strong>Subject ID:</strong> ${details.id}
            </div>
            <div class="info-item">
              <strong>Department Created:</strong> ${createdDate}
            </div>
          </div>
          
          <div class="career-details-footer">
            <button id="backToList" class="btn-back">
              <i class="fas fa-arrow-left"></i> Back to home
            </button>
          </div>
        </div>
      </div>
    `);

    scrollToTop();
  }

  function showLoading() {
    $("#loadingSpinner").show();
    $("#careerContainer").hide();
  }

  function hideLoading() {
    $("#loadingSpinner").hide();
    $("#careerContainer").show();
  }

  function showError(message) {
    const container = $("#careerContainer");
    container.html(`
      <div class="col-12">
        <div class="alert alert-danger" role="alert">
          <i class="fas fa-exclamation-triangle me-2"></i>
          <strong>Error:</strong> ${message}
          <div class="mt-3">
            <button type="button" class="btn btn-outline-danger btn-sm me-2" onclick="location.reload()">
              <i class="fas fa-refresh me-1"></i>Try Again
            </button>
            <button id="backToList" class="btn btn-outline-primary btn-sm">
              <i class="fas fa-arrow-left me-1"></i>Back to List
            </button>
          </div>
        </div>
      </div>
    `);
  }

  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function scrollToTop() {
    $("html, body").animate({ scrollTop: 0 }, 300);
  }

  // Handle browser back/forward buttons
  window.addEventListener("popstate", function (event) {
    const urlParams = new URLSearchParams(window.location.search);
    const careerId = urlParams.get("id");

    if (careerId) {
      $(".hero-section, .stats-section, .pagination-container").hide();
      loadAndShowCareerDetails(careerId);
    } else {
      $(".hero-section, .stats-section, .pagination-container").show();
      loadCareers(currentPage);
    }
  });
});
