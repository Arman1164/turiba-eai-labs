# Enterprise Continuous Application Software Integration Labs

This repository contains practical tasks and labs for students at **Turiba University** enrolled in the course **"Enterprise Continuous Application Software Integration"**.

The curriculum and exercises are based on the foundational work of Gregor Hohpe and Bobby Woolf in *Enterprise Integration Patterns*.

## Course Overview

The primary goal of these labs is to provide hands-on experience with:
- **Enterprise Integration Patterns (EIP)**: Implementing core patterns like Splitter, Aggregator, Content-Based Router, etc.
- **Message-Oriented Middleware**: Working with message brokers like RabbitMQ.
- **Microservices Architecture**: Building and orchestrating distributed services.
- **Containerization**: Using Docker and Docker Compose for reproducible environments.

## Available Labs

| Session | Topic | Description | Due Date | Link |
|:-------:|:------|:------------|:---------|:-----|
| **1** | **EIP Routing** | Implement Splitter, Content-Based Router, and Aggregator patterns using RabbitMQ and Python. | 17 February 2026 | [Go to Lab](./practice-00-routing) |
| **2** | **Data Integration & Schema Transformation** | Transform different order formats (Web, Mobile, B2B) into a canonical schema using Node-RED. | **February 27th** | [Go to Lab](./practice-01-transformation) |
| **3** | **Event-Driven Messaging with RabbitMQ** | Implement publish-subscribe messaging with retries, DLQ handling, correlation IDs, and idempotent consumers using RabbitMQ and Node.js. | **08.03.2026, 20:00 EET (Europe/Riga, UTC+2)** | [Go to Lab](./practice-02-events) |
|**4**| **API orchestration**| Implement API orchestration| **15.03.2026, 20:00 EET (Europe/Riga, UTC+2)**| [Go to lab](./practice-03-api_orchestration_and_composition/) |
|**5**| **Capstone/Final project**| Implement full EAI solution| **10.04.2026, 20:00 EET (Europe/Riga, UTC+2)**| [Go to lab](./practice-04-capstone/) |


> *More labs will be added as the course progresses.*

## Prerequisites

To successfully run these labs, you will need the following tools installed on your machine:

1.  **Docker & Docker Compose**: Essential for running the message broker and microservices environments.
    - [Get Docker Desktop](https://www.docker.com/products/docker-desktop/)
2.  **Git**: To clone this repository.
    - [Get Git](https://git-scm.com/downloads)
3.  **HTTP Client**: For testing APIs (e.g., `curl`, Postman, or Insomnia).
4.  **(Optional) Python 3.9+**: If you wish to run services locally outside of Docker for debugging.

## Getting Started

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-org/turiba-eai-labs.git
    cd turiba-eai-labs
    ```

2.  **Navigate to a specific lab directory:**
    ```bash
    cd practice-00-routing
    ```

3.  **Follow the `README.md` instructions in that specific directory** to start the environment and complete the tasks.

## References

- **[Enterprise Integration Patterns](https://www.enterpriseintegrationpatterns.com/)**: The official website for the patterns used in this course.
- **[RabbitMQ Tutorials](https://www.rabbitmq.com/getstarted.html)**: Excellent resources for understanding the message broker.
- **[Docker Documentation](https://docs.docker.com/)**: Guides for containerization.

---
*Turiba University - Faculty of Information Technologies*
