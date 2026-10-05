import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.DefaultCorsProcessor;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

public class TestCorsProcessor {
    public static void main(String[] args) throws Exception {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.addAllowedOriginPattern("*");
        configuration.addAllowedMethod("*");
        configuration.addAllowedHeader("*");
        configuration.setAllowCredentials(false);
        
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/v3/api-docs");
        request.addHeader("Origin", "http://localhost:8082");
        MockHttpServletResponse response = new MockHttpServletResponse();
        
        DefaultCorsProcessor processor = new DefaultCorsProcessor();
        boolean passed = processor.processRequest(configuration, request, response);
        System.out.println("Passed: " + passed);
        System.out.println("Status: " + response.getStatus());
        System.out.println("Body: " + response.getContentAsString());
    }
}
