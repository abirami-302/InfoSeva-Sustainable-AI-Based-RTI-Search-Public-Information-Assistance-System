import org.springframework.web.cors.CorsConfiguration;
import org.springframework.http.HttpMethod;
public class TestCorsConfig {
    public static void main(String[] args) {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.addAllowedOriginPattern("*");
        configuration.addAllowedMethod("*");
        configuration.addAllowedHeader("*");
        configuration.setAllowCredentials(false);
        System.out.println("Origin: " + configuration.checkOrigin("http://localhost:8082"));
        System.out.println("Method: " + configuration.checkHttpMethod(HttpMethod.GET));
    }
}