$(document).ready(function () {
  let currentPage = 1;
  let totalPages = 1;
  let totalCareers = 0;
  let careerDetails = {}; // Cache for career details

  // API Configuration
  const API_BASE_URL = "https://www.ehlcrm.theskyroute.com/api/test";
  const CAREER_LIST_ENDPOINT = `${API_BASE_URL}/top-future-career`;
  const CAREER_DETAILS_ENDPOINT =
    "https://www.ehlcrm.theskyroute.com/api/future-career-details";

  // Department mapping (you can expand this based on your needs)
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
    loadCareers(currentPage);
    setupEventListeners();
  }

  function setupEventListeners() {
    // Home link click
    $("#homeLink").on("click", function (e) {
      e.preventDefault();
      currentPage = 1;
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

    // Load career details on hover (delegated)
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
      error: function (xhr, status, error) {
        console.error("API Error:", { xhr, status, error });
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
          updateCareerCardWithDetails(cardElement, response.data);
        }
      },
      error: function (xhr, status, error) {
        console.error("Failed to load career details:", error);
        // Silently fail for hover details
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
        // Only show active careers
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
    console.log("career: ", career);
    const departmentName =
      DEPARTMENT_NAMES[career.course_department_id] || "General Studies";
    const isPopular = career.is_popular === 1;
    const createdDate = formatDate(career.created_at);
    const overview = career?.overview
      ? truncateText(escapeHtml(career.overview), 150)
      : "No overview available.";

    // Get image URL or use gradient fallback
    const imageStyle = career.image
      ? `background-image: url('https://www.ehlcrm.theskyroute.com${career.image}')`
      : "background: linear-gradient(45deg, #f39c12, #e67e22)";

    return `
            <div class="col-lg-3 col-md-4 col-sm-6">
                <div class="career-card" data-career-id="${career.id}">
                    <div class="career-image" style="${imageStyle}">
                        ${
                          isPopular
                            ? '<div class="popular-badge">Popular Career</div>'
                            : ""
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
                            <div><i class="fas fa-check-circle text-success"></i> ${career?.status === 1 ? "Active" : "Inactive"}</div>
                        </div>
                         <div class="career-meta">
                            <div><i class="fas fa-book text-success me-1"></i>Serial No- ${career?.serial_no}</div>
                        </div>
                        <div class="mb-3">
                            <span class="department-tag">${escapeHtml(
                              departmentName
                            )}</span>
                        </div>
                        <button class="view-details-btn" data-career-id="${
                          career.id
                        }">
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
                        <a class="page-link" href="#" data-page="${
                          currentPage - 1
                        }" ${!link.url ? 'tabindex="-1"' : ""}>
                            <i class="fas fa-chevron-left"></i> Previous
                        </a>
                    </li>
                `;
      } else if (link.label === "Next &raquo;") {
        pageItem = `
                    <li class="page-item ${!link.url ? "disabled" : ""}">
                        <a class="page-link" href="#" data-page="${
                          currentPage + 1
                        }" ${!link.url ? 'tabindex="-1"' : ""}>
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
    // Store the career ID and redirect to details page
    localStorage.setItem("selectedCareerId", careerId);
    if (careerDetails[careerId]) {
      const details = careerDetails[careerId];
      alert(
        `Career: ${details.name}\n\nOverview: ${details.overview}\n\nClick OK to continue.`
      );
    } else {
      // Load details first, then show
      $.ajax({
        url: `${CAREER_DETAILS_ENDPOINT}?id=${careerId}`,
        method: "GET",
        success: function (response) {
          if (response && response.data) {
            const details = response.data;
            alert(
              `Career: ${details.name}\n\nOverview: ${details.overview}\n\nClick OK to continue.`
            );
          }
        },
        error: function () {
          alert("Unable to load career details. Please try again.");
        },
      });
    }
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
                    <button type="button" class="btn btn-outline-danger btn-sm ms-3" onclick="location.reload()">
                        <i class="fas fa-refresh me-1"></i>Try Again
                    </button>
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
});
