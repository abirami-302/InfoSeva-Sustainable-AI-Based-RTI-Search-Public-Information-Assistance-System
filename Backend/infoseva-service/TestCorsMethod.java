import org.springframework.web.cors.CorsConfiguration;
import org.springframework.http.HttpMethod;
import java.util.List;
public class TestCorsMethod {
    public static void main(String[] args) {
        CorsConfiguration config = new CorsConfiguration();
        config.addAllowedMethod("*");
        List<HttpMethod> allowed = config.getAllowedMethods() != null ? config.getAllowedMethods().stream().map(HttpMethod::valueOf).toList() : null;
        System.out.println(allowed);
    }
}
